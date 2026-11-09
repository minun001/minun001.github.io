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

PROFILE_ROW = """
<tr data-extra='row' class='extra gsc_a_tr'>
  <td class='gsc_a_t'><a class='gsc_a_at extra' data-extra='title' href='/citations?view_op=view_citation&amp;citation_for_view=2AUQlE8AAAAJ:example'>Example <b>paper</b></a>
  <div class='extra gs_gray'>Hyunsik Min, Another Author</div><div class='gs_gray'>Example Journal</div></td>
  <td class='gsc_a_c'><a href='/scholar?cites=123' class='gsc_a_ac extra' data-extra='count'><span>1,234</span></a></td>
  <td data-extra='year' class='gsc_a_y'><span>2026</span></td>
</tr>
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
                "citation_schema_version": 2,
                "checked_at": checked_at, "total_records": 1,
                "sections": [{"count": 1, "items": [{"source": "scholar", "citation_source": "scholar", "citation_count": 52, "citation_checked_at": checked_at}]}],
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
                record = archive["sections"][0]["items"][0]
                record.update(source="manual", citation_source=None, citation_count=None, citation_checked_at=None)
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
        rows = [{"citation_id": "hidden", "scholar_url": "hidden", "title": "Hidden", "citation_count": 0}, {"citation_id": "visible", "scholar_url": "visible", "title": "Visible", "citation_count": 7}]
        overrides = {"profile_name": "Example", "scholar_overrides": {"hidden": {"hidden": True}}}
        with patch.object(scholar, "load_overrides", return_value=overrides), patch.object(scholar, "fetch_html", side_effect=[METRICS_HTML]) as fetch, patch.object(scholar, "parse_profile_rows", return_value=rows), patch.object(scholar, "parse_detail_page") as detail, patch.object(scholar, "build_scholar_record", return_value={"id": "visible"}), patch.object(scholar, "build_publications_payload", return_value={"total_records": 1}), patch.object(scholar, "write_json"), patch.object(scholar, "write_publications_payload_if_changed", return_value=True), patch.object(scholar, "report_refresh") as report:
            self.assertEqual(scholar.main(), "updated")
            self.assertEqual([call.args[0] for call in fetch.call_args_list], [scholar.PROFILE_URL])
            detail.assert_not_called()
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
        row = {"citation_id": "example", "title": "Example", "scholar_url": "https://scholar.google.com/detail"}
        with patch.dict(scholar.os.environ, {"GITHUB_ACTIONS": "true"}), patch.object(scholar, "load_overrides", return_value={}), patch.object(scholar, "fetch_html", side_effect=[METRICS_HTML, "Captcha"]), patch.object(scholar, "parse_profile_rows", return_value=[row]), patch.object(scholar, "write_json") as write, patch("builtins.print") as output:
            with self.assertRaises(RuntimeError):
                scholar.main(refresh_details=True)
            write.assert_not_called()
            self.assertTrue(output.call_args.args[0].startswith("::error::"))

    def test_profile_counts_accept_attribute_order_extra_classes_nested_text_and_commas(self):
        rows = scholar.parse_profile_rows(PROFILE_ROW)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["citation_count"], 1234)
        self.assertEqual(rows[0]["title"], "Example paper")
        self.assertEqual(rows[0]["year"], 2026)
        self.assertEqual(rows[0]["venue_row"], "Example Journal")
        self.assertIn("citation_for_view=2AUQlE8AAAAJ:example", rows[0]["scholar_url"])

    def test_explicit_empty_citation_anchor_is_a_verified_zero(self):
        page = PROFILE_ROW.replace("<span>1,234</span>", "")
        self.assertEqual(scholar.parse_profile_rows(page)[0]["citation_count"], 0)

    def test_missing_unreadable_or_truncated_counts_never_become_zero(self):
        for page in (
            PROFILE_ROW.replace("gsc_a_ac extra", "unknown"),
            PROFILE_ROW.replace("1,234", "unavailable"),
            PROFILE_ROW.replace("1,234", "-1"),
            PROFILE_ROW.replace("</tr>", ""),
        ):
            with self.subTest(page=page), self.assertRaises(RuntimeError):
                scholar.parse_profile_rows(page)

    def test_unreadable_profile_count_keeps_both_published_snapshots(self):
        page = METRICS_HTML + PROFILE_ROW.replace("1,234", "unavailable")
        with patch.object(scholar, "fetch_html", return_value=page), patch.object(scholar, "write_json") as metrics_write, patch.object(scholar, "write_publications_payload_if_changed") as archive_write:
            with self.assertRaisesRegex(RuntimeError, "citation count is unreadable"):
                scholar.main()
            metrics_write.assert_not_called()
            archive_write.assert_not_called()

    def test_partial_profile_and_duplicate_ids_cannot_publish(self):
        for page in (PROFILE_ROW + "<button id='gsc_bpf_more'>Show more</button>", PROFILE_ROW * 2):
            with self.subTest(page=page), self.assertRaises(RuntimeError):
                scholar.parse_profile_rows(page)
        self.assertEqual(len(scholar.parse_profile_rows(PROFILE_ROW + "<button disabled id='gsc_bpf_more'>Show more</button>")), 1)

    def test_verifying_screen_is_detected_without_captcha_text(self):
        with self.assertRaises(scholar.ScholarAccessBlocked):
            scholar.reject_access_challenge("<html><title>Verifying...</title></html>")

    def test_citation_schema_and_per_paper_dates_are_required_for_freshness(self):
        for kind in ("legacy", "missing_count", "negative", "boolean", "old_date", "unknown_with_count"):
            payloads = self.snapshots()
            archive = payloads[scholar.PUBLICATIONS_OUTPUT_PATH]
            record = archive["sections"][0]["items"][0]
            if kind == "legacy":
                archive.pop("citation_schema_version")
            elif kind == "missing_count":
                record.pop("citation_count")
            elif kind == "negative":
                record["citation_count"] = -1
            elif kind == "boolean":
                record["citation_count"] = True
            elif kind == "old_date":
                record["citation_checked_at"] = (self.today - timedelta(days=1)).isoformat()
            else:
                archive["total_records"] = archive["sections"][0]["count"] = 2
                archive["sections"][0]["items"].append({"citation_source": None, "citation_count": 0})
            with self.subTest(kind=kind), patch.object(scholar, "load_json_if_exists", side_effect=payloads.get):
                self.assertIsNone(scholar.last_successful_check(self.today))

    def test_daily_check_uses_one_request_and_preserves_curated_metadata(self):
        overrides = scholar.load_overrides()
        previous = scholar.load_json_if_exists(scholar.PUBLICATIONS_OUTPUT_PATH)
        old_record = next(item for section in previous["sections"] for item in section["items"] if item["id"] == "5nxA0vEk-isC")
        row = {"citation_id": old_record["id"], "title": old_record["title"], "scholar_url": old_record["scholar_url"], "citation_count": 9, "year": old_record["year"]}
        with patch.object(scholar, "fetch_html", return_value=METRICS_HTML) as fetch, patch.object(scholar, "parse_profile_rows", return_value=[row]), patch.object(scholar, "write_json") as write, patch.object(scholar, "write_publications_payload_if_changed", return_value=True) as archive_write:
            scholar.main()
        fetch.assert_called_once_with(scholar.PROFILE_URL)
        archive = archive_write.call_args.args[0]
        updated = next(item for section in archive["sections"] for item in section["items"] if item["id"] == old_record["id"])
        for field in ("title", "authors", "doi", "volume", "issue", "pages", "details", "image", "summary"):
            self.assertEqual(updated[field], old_record[field], field)
        self.assertEqual(updated["citation_count"], 9)
        self.assertEqual(updated["citation_source"], "scholar")
        self.assertEqual(updated["citation_checked_at"], archive["checked_at"])
        self.assertEqual(write.call_args.args[1]["checked_at"], archive["checked_at"])

    def test_manual_record_citations_use_explicit_id_without_replacing_its_identity(self):
        overrides = scholar.load_overrides()
        manual = overrides["manual_records"][0]
        row = {"citation_id": manual["scholar_citation_id"], "title": "Scholar title", "scholar_url": "https://scholar.google.com/citations?citation_for_view=2AUQlE8AAAAJ:8k81kl-MbHgC", "citation_count": 3}
        record = scholar.build_manual_record(manual)
        scholar.update_citation(record, row, self.today.isoformat())
        self.assertEqual(record["id"], "manual-its-world-congress-2026")
        self.assertEqual(record["source"], "manual")
        self.assertEqual(record["title"], manual["display_title"])
        self.assertEqual(record["citation_count"], 3)
        self.assertEqual(record["citation_source"], "scholar")
        self.assertEqual(record["scholar_url"], row["scholar_url"])
        scholar.update_citation(record, None, self.today.isoformat())
        self.assertIsNone(record["citation_count"])
        self.assertIsNone(record["citation_checked_at"])

    def test_manual_metadata_with_verified_scholar_citations_can_be_fresh(self):
        payloads = self.snapshots()
        payloads[scholar.PUBLICATIONS_OUTPUT_PATH]["sections"][0]["items"][0]["source"] = "manual"
        with patch.object(scholar, "load_json_if_exists", side_effect=payloads.get):
            self.assertEqual(scholar.last_successful_check(self.today), self.today)

    def test_local_fallback_can_run_on_battery_and_retries_failures_without_waking_pc(self):
        script = Path("tools/register_scholar_local_fallback_task.ps1").read_text(encoding="utf-8")
        for flag in ("-AllowStartIfOnBatteries", "-DontStopIfGoingOnBatteries", "-RestartCount 2", "-RestartInterval (New-TimeSpan -Hours 2)", "-WindowStyle Hidden"):
            self.assertIn(flag, script)
        self.assertNotIn("-WakeToRun", script)

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

    def test_verified_publication_metadata_survives_incomplete_scholar_details(self):
        override = scholar.load_overrides()["scholar_overrides"]["5nxA0vEk-isC"]
        row = {
            "citation_id": "5nxA0vEk-isC", "title": "Anticipatory Driving",
            "scholar_url": "https://scholar.google.com/example", "year": 2026,
            "citation_count": 7,
        }
        for detail in ({"Publication date": "2026"}, {
            "Publication date": "2026", "Volume": "early access", "Issue": "",
            "Pages": "1-14", "DOI": "incomplete",
        }):
            with self.subTest(detail=detail):
                record = scholar.build_scholar_record(row, detail, override)
                for field, expected in {
                    "doi": "10.1109/TITS.2026.3703652", "volume": "27",
                    "issue": "10", "pages": "12737-12750",
                }.items():
                    self.assertEqual(record[field], expected)
                self.assertEqual(record["citation_count"], 7)
                self.assertIn("Published Oct. 2026", record["details"])
                self.assertIn("number={10}", record["bibtex"])
                self.assertIn("doi={10.1109/TITS.2026.3703652}", record["bibtex"])

    def test_bibliographic_fields_still_fall_back_to_scholar_without_curated_values(self):
        row = {"citation_id": "example", "title": "Example", "scholar_url": "example", "year": 2026}
        detail = {"Journal": "Example Journal", "Volume": "2", "Issue": "3", "Pages": "4-5"}
        for override in (None, {}, {"volume": "", "issue": "", "pages": ""}):
            with self.subTest(override=override):
                record = scholar.build_scholar_record(row, detail, override)
                for field, source in (("volume", "Volume"), ("issue", "Issue"), ("pages", "Pages")):
                    self.assertEqual(record[field], detail[source])

    def test_published_snapshot_matches_curated_metadata_without_changing_check_dates(self):
        payload = json.loads(scholar.PUBLICATIONS_OUTPUT_PATH.read_text(encoding="utf-8"))
        record = next(item for section in payload["sections"] for item in section["items"] if item["id"] == "5nxA0vEk-isC")
        override = scholar.load_overrides()["scholar_overrides"][record["id"]]
        for field in ("details", "doi", "volume", "issue", "pages"):
            self.assertEqual(record[field], override[field])
        for section in payload["sections"]:
            for item in section["items"]:
                self.assertEqual(item["search_terms"], scholar.build_search_terms(item))
        metrics = json.loads(scholar.METRICS_OUTPUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(payload["checked_at"], metrics["checked_at"])

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
