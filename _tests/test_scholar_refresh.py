import io
import json
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import mock_open, patch
from urllib.error import HTTPError, URLError

from tools import update_scholar_metrics as scholar


METRICS_HTML = """
<table class='metrics' id='gsc_rsb_st'>
  <tr><td><a>Citations</a></td><td class='gsc_rsb_std'>1,234</td><td>52</td></tr>
  <tr><td><a>h-index</a></td><td>3</td><td><span>3</span></td></tr>
  <tr><td>i10-index</td><td>2</td><td>2</td></tr>
</table>
"""


class ScholarRefreshTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(scholar.os.environ, {"GITHUB_ACTIONS": "false", "GITHUB_OUTPUT": ""})
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.today = scholar.datetime.now(scholar.KST).date()

    def snapshots(self, checked=None):
        checked_at = (checked or self.today).isoformat()
        return {
            scholar.METRICS_OUTPUT_PATH: {
                "checked_at": checked_at,
                "citations": {"all": 52}, "h_index": {"all": 3}, "i10_index": {"all": 2},
            },
            scholar.PUBLICATIONS_OUTPUT_PATH: {
                "checked_at": checked_at, "total_records": 1,
                "sections": [{"count": 1, "items": [{"source": "scholar"}]}],
            },
        }

    def test_fresh_complete_snapshots_skip_all_network_access(self):
        payloads = self.snapshots()
        with patch.object(scholar, "load_json_if_exists", side_effect=payloads.get), patch.object(scholar, "fetch_html") as fetch, patch.object(scholar, "load_overrides") as overrides, patch.object(scholar, "write_json") as write:
            self.assertEqual(scholar.main(skip_if_fresh=True), "fresh")
            fetch.assert_not_called()
            overrides.assert_not_called()
            write.assert_not_called()

    def test_snapshot_validation_rejects_missing_mismatched_future_or_incomplete_data(self):
        for kind in ("missing", "mismatch", "future", "empty", "wrong_total", "wrong_count", "negative", "boolean", "manual_only"):
            payloads = self.snapshots()
            metrics = payloads[scholar.METRICS_OUTPUT_PATH]
            archive = payloads[scholar.PUBLICATIONS_OUTPUT_PATH]
            if kind == "missing":
                payloads.pop(scholar.PUBLICATIONS_OUTPUT_PATH)
            elif kind == "mismatch":
                archive["checked_at"] = (self.today - timedelta(days=1)).isoformat()
            elif kind == "future":
                for payload in payloads.values():
                    payload["checked_at"] = (self.today + timedelta(days=1)).isoformat()
            elif kind == "empty":
                archive["sections"] = []
            elif kind == "wrong_total":
                archive["total_records"] = 2
            elif kind == "wrong_count":
                archive["sections"][0]["count"] = 2
            elif kind == "negative":
                metrics["citations"]["all"] = -1
            elif kind == "boolean":
                metrics["citations"]["all"] = True
            elif kind == "manual_only":
                archive["sections"][0]["items"][0]["source"] = "manual"
            with self.subTest(kind=kind), patch.object(scholar, "load_json_if_exists", side_effect=payloads.get):
                self.assertIsNone(scholar.last_successful_check(self.today))

    def test_invalid_json_cannot_be_used_as_a_fallback(self):
        error = json.JSONDecodeError("invalid", "", 0)
        with patch.object(scholar, "load_json_if_exists", side_effect=error):
            self.assertIsNone(scholar.last_successful_check(self.today))

    def test_recent_access_block_is_explicitly_deferred_without_rewriting_dates(self):
        checked = self.today - timedelta(days=1)
        errors = [HTTPError("https://scholar.google.com", 403, "Forbidden", {}, None), scholar.ScholarAccessBlocked("Captcha"), URLError("temporary")]
        for error in errors:
            with self.subTest(error=error), patch.dict(scholar.os.environ, {"GITHUB_ACTIONS": "true"}), patch.object(scholar, "last_successful_check", return_value=checked), patch.object(scholar, "fetch_html", side_effect=error), patch.object(scholar, "write_json") as write, patch.object(scholar, "report_refresh") as report, patch("builtins.print") as output:
                self.assertEqual(scholar.main(defer_on_block=True), "deferred")
                write.assert_not_called()
                report.assert_called_once_with("deferred", checked, self.today)
                self.assertIn("::warning::", output.call_args.args[0])
                self.assertIn("NOT updated", output.call_args.args[0])

    def test_access_failure_is_fatal_with_missing_or_three_day_old_snapshots(self):
        for checked in (None, self.today - timedelta(days=3), self.today - timedelta(days=4)):
            error = HTTPError("https://scholar.google.com", 403, "Forbidden", {}, None)
            with self.subTest(checked=checked), patch.object(scholar, "last_successful_check", return_value=checked), patch.object(scholar, "fetch_html", side_effect=error), patch.object(scholar, "write_json") as write:
                with self.assertRaises(HTTPError):
                    scholar.main(defer_on_block=True)
                write.assert_not_called()

    def test_parser_errors_are_not_hidden_as_access_blocks(self):
        with patch.object(scholar, "last_successful_check", return_value=self.today), patch.object(scholar, "fetch_html", return_value="<html>changed markup</html>"), patch.object(scholar, "write_json") as write:
            with self.assertRaisesRegex(RuntimeError, "Failed to parse metrics"):
                scholar.main(defer_on_block=True)
            write.assert_not_called()

    def test_strict_local_refresh_still_fails_on_access_block(self):
        error = HTTPError("https://scholar.google.com", 403, "Forbidden", {}, None)
        with patch.object(scholar, "last_successful_check", return_value=self.today), patch.object(scholar, "fetch_html", side_effect=error), self.assertRaises(HTTPError):
            scholar.main()

    def test_hidden_records_are_not_requested_and_success_reports_updated(self):
        rows = [{"citation_id": "hidden", "scholar_url": "hidden"}, {"citation_id": "visible", "scholar_url": "visible"}]
        overrides = {"profile_name": "Example", "scholar_overrides": {"hidden": {"hidden": True}}}
        with patch.object(scholar, "load_overrides", return_value=overrides), patch.object(scholar, "fetch_html", side_effect=[METRICS_HTML, "detail"]) as fetch, patch.object(scholar, "parse_profile_rows", return_value=rows), patch.object(scholar, "parse_detail_page", return_value={}), patch.object(scholar, "build_scholar_record", return_value={"id": "visible"}), patch.object(scholar, "build_publications_payload", return_value={"total_records": 1}), patch.object(scholar, "write_json"), patch.object(scholar, "write_publications_payload_if_changed", return_value=True), patch.object(scholar, "report_refresh") as report:
            self.assertEqual(scholar.main(), "updated")
            self.assertEqual([call.args[0] for call in fetch.call_args_list], [scholar.PROFILE_URL, "visible"])
            self.assertEqual(report.call_args.args[0], "updated")

    def test_actions_outputs_distinguish_deferred_from_updated(self):
        checked = self.today - timedelta(days=1)
        with patch.dict(scholar.os.environ, {"GITHUB_OUTPUT": "step-output"}), patch("builtins.open", mock_open()) as output:
            scholar.report_refresh("deferred", checked, self.today)
            output.assert_called_once_with("step-output", "a", encoding="utf-8")
            written = "".join(call.args[0] for call in output().write.call_args_list)
            self.assertEqual(written, f"status=deferred\nchecked_at={checked}\nstale_days=1\n")

    def test_workflow_never_refetches_on_data_commits_or_source_pushes(self):
        workflow = Path(".github/workflows/update-scholar-metrics.yml").read_text(encoding="utf-8")
        push = workflow.split("  push:", 1)[1].split("  workflow_dispatch:", 1)[0]
        self.assertNotIn("_data/", push)
        refresh = workflow.split("      - name: Refresh Google Scholar data", 1)[1].split("      - name:", 1)[0]
        self.assertIn("if: github.event_name != 'push'", refresh)
        self.assertIn("--skip-if-fresh", refresh)
        self.assertIn("--defer-on-block --max-stale-days 3", refresh)
        self.assertIn("if: steps.scholar.outputs.status == 'updated'", workflow)
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn("  pages: write", workflow)
        self.assertIn('gh api --method POST "repos/$GITHUB_REPOSITORY/pages/builds"', workflow)

    def test_powershell_fallback_validates_both_snapshots_without_extra_log_files(self):
        fallback = Path("tools/scholar_local_fallback.ps1").read_text(encoding="utf-8")
        self.assertIn('"--skip-if-fresh"', fallback)
        self.assertIn('"-B", $UpdateScriptPath', fallback)
        self.assertNotIn("Add-Content", fallback)
        self.assertNotIn("$LogPath", fallback)

    def test_unexpected_http_errors_are_not_deferred(self):
        error = HTTPError("https://scholar.google.com", 404, "Not found", {}, None)
        with patch.object(scholar, "last_successful_check", return_value=self.today), patch.object(scholar, "fetch_html", side_effect=error), self.assertRaises(HTTPError):
            scholar.main(defer_on_block=True)

    def test_nonpositive_staleness_limit_is_rejected_before_fetch(self):
        with patch.object(scholar, "fetch_html") as fetch, self.assertRaises(ValueError):
            scholar.main(max_stale_days=0)
        fetch.assert_not_called()

    def test_metrics_accept_whitespace_nested_text_and_attribute_variations(self):
        result = scholar.parse_metrics(METRICS_HTML)
        self.assertEqual(result["citations"], {"all": 1234, "since_2021": 52})
        self.assertEqual(result["h_index"]["all"], 3)

    def test_challenge_and_partial_metrics_are_rejected(self):
        for page in ["<p>Captcha</p>", METRICS_HTML.replace("i10-index", "unknown")]:
            with self.subTest(page=page), self.assertRaises(RuntimeError):
                scholar.parse_metrics(page)

    def test_detail_challenge_is_rejected(self):
        with self.assertRaises(RuntimeError):
            scholar.parse_detail_page("<p>Unusual traffic</p>")

    def test_successful_check_updates_date_even_when_counts_are_unchanged(self):
        old = {"checked_at": "2026-10-01", "checked_at_display": "October 1, 2026", "sections": []}
        new = {**old, "checked_at": "2026-10-06", "checked_at_display": "October 6, 2026"}
        with patch.object(scholar, "load_json_if_exists", return_value=old), patch.object(scholar, "write_json") as write:
            self.assertTrue(scholar.write_publications_payload_if_changed(new))
            write.assert_called_once_with(scholar.PUBLICATIONS_OUTPUT_PATH, new)

    def test_identical_successful_check_does_not_rewrite(self):
        payload = {"checked_at": "2026-10-06", "sections": []}
        with patch.object(scholar, "load_json_if_exists", return_value=payload), patch.object(scholar, "write_json") as write:
            self.assertFalse(scholar.write_publications_payload_if_changed(payload))
            write.assert_not_called()

    def test_actions_refresh_failure_raises_and_keeps_both_snapshots(self):
        with patch.dict(scholar.os.environ, {"GITHUB_ACTIONS": "true"}), patch.object(scholar, "load_overrides", return_value={}), patch.object(scholar, "fetch_html", return_value="Captcha"), patch.object(scholar, "write_json") as write, patch("builtins.print") as output:
            with self.assertRaises(RuntimeError):
                scholar.main()
            write.assert_not_called()
            self.assertTrue(output.call_args.args[0].startswith("::error::"))

    def test_empty_archive_is_not_published(self):
        with patch.dict(scholar.os.environ, {"GITHUB_ACTIONS": "true"}), patch.object(scholar, "load_overrides", return_value={}), patch.object(scholar, "fetch_html", return_value=METRICS_HTML), patch.object(scholar, "write_json") as write, patch("builtins.print") as output:
            with self.assertRaisesRegex(RuntimeError, "no readable publication rows"):
                scholar.main()
            write.assert_not_called()
            self.assertTrue(output.call_args.args[0].startswith("::error::"))

    def test_failed_detail_request_does_not_update_aggregate_metrics(self):
        row = {"scholar_url": "https://scholar.google.com/detail"}
        with patch.dict(scholar.os.environ, {"GITHUB_ACTIONS": "true"}), patch.object(scholar, "load_overrides", return_value={}), patch.object(scholar, "fetch_html", side_effect=[METRICS_HTML, "Captcha"]), patch.object(scholar, "parse_profile_rows", return_value=[row]), patch.object(scholar, "write_json") as write, patch("builtins.print") as output:
            with self.assertRaises(RuntimeError):
                scholar.main()
            write.assert_not_called()
            self.assertTrue(output.call_args.args[0].startswith("::error::"))

    def test_bibtex_uses_and_between_individual_authors(self):
        for authors, expected in [
            ("Hyunsik Min, Byeongjoon Noh", "Hyunsik Min and Byeongjoon Noh"),
            (" Hyunsik Min , Gyeongseon Baek, Yeeun Kim, Byeongjoon Noh ", "Hyunsik Min and Gyeongseon Baek and Yeeun Kim and Byeongjoon Noh"),
            ("Hyunsik Min", "Hyunsik Min"),
        ]:
            with self.subTest(authors=authors):
                record = {"title": "Example", "category": "international-journals", "year": 2026, "authors": authors}
                self.assertIn(f"author={{{expected}}}", scholar.build_bibtex(record))
                self.assertEqual(record["authors"], authors)

    def test_published_bibtex_matches_generator_without_changing_display_authors(self):
        payload = json.loads(scholar.PUBLICATIONS_OUTPUT_PATH.read_text(encoding="utf-8"))
        records = [record for section in payload["sections"] for record in section["items"] if record.get("bibtex")]
        self.assertTrue(records)
        for record in records:
            with self.subTest(title=record["title"]):
                self.assertEqual(record["bibtex"], scholar.build_bibtex(record))

    def test_transient_fetch_is_retried_with_bounded_backoff(self):
        with patch.object(scholar, "urlopen", side_effect=[URLError("temporary"), io.BytesIO(b"ok")]) as fetch, patch.object(scholar.time, "sleep") as sleep:
            self.assertEqual(scholar.fetch_html("https://scholar.google.com"), "ok")
            self.assertEqual(fetch.call_count, 2)
            sleep.assert_called_once_with(2)

    def test_retry_stops_after_three_attempts(self):
        with patch.object(scholar, "urlopen", side_effect=URLError("temporary")) as fetch, patch.object(scholar.time, "sleep") as sleep:
            with self.assertRaises(URLError):
                scholar.fetch_html("https://scholar.google.com")
            self.assertEqual(fetch.call_count, 3)
            self.assertEqual([call.args[0] for call in sleep.call_args_list], [2, 4])

    def test_forbidden_response_is_not_retried(self):
        error = HTTPError("https://scholar.google.com", 403, "Forbidden", {}, None)
        with patch.object(scholar, "urlopen", side_effect=error) as fetch, patch.object(scholar.time, "sleep") as sleep:
            with self.assertRaises(HTTPError):
                scholar.fetch_html("https://scholar.google.com")
            self.assertEqual(fetch.call_count, 1)
            sleep.assert_not_called()


if __name__ == "__main__":
    unittest.main()
