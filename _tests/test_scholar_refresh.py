import io
import json
import unittest
from unittest.mock import patch
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
