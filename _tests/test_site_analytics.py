import hashlib
from contextlib import closing
import importlib.util
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from urllib import error, request
from uuid import uuid4

spec = importlib.util.spec_from_file_location("site_analytics", Path(__file__).resolve().parents[1] / "tools/site_analytics.py")
analytics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analytics)
PASSWORD = "test-only-password-8274"


def event(browser=None, path="/"):
    return {"event_id": str(uuid4()), "browser_id": browser or str(uuid4()), "page_path": path,
            "referrer_host": "example.org", "device": "desktop", "consent": True}


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.now = datetime(2026, 10, 11, 15, 5, tzinfo=timezone.utc)
        self.store = analytics.AnalyticsStore(Path(self.temp.name) / "visits.sqlite3", now=lambda: self.now)

    def test_daily_browsers_and_pageviews_are_distinct_and_kst(self):
        browser = str(uuid4())
        self.store.record(event(browser))
        self.store.record(event(browser, "/profile/"))
        self.store.record(event())
        data = self.store.summary(7)
        self.assertEqual(data["daily"][-1], {"date": "2026-10-12", "browsers": 2, "pageviews": 3})
        self.assertEqual(data["totals"], {"browsers": 2, "pageviews": 3})
        self.assertEqual(len(data["daily"]), 7)
        self.assertEqual(data["daily"][0]["pageviews"], 0)

    def test_retries_deduplicate_but_reloads_count(self):
        payload = event()
        self.assertTrue(self.store.record(payload))
        self.assertFalse(self.store.record(payload))
        self.store.record(event(payload["browser_id"]))
        self.assertEqual(self.store.summary(7)["totals"], {"browsers": 1, "pageviews": 2})

    def test_same_browser_across_days_is_not_double_counted_in_range(self):
        browser = str(uuid4())
        self.store.record(event(browser))
        self.now += timedelta(days=1)
        self.store.record(event(browser))
        data = self.store.summary(7)
        self.assertEqual(data["totals"]["browsers"], 1)
        self.assertEqual(sum(row["browsers"] for row in data["daily"]), 2)

    def test_private_paths_query_strings_and_unconsented_visits_rejected(self):
        for path in ("/workspace/", "/analytics/", "/profile/?email=private@example.org", "/privacy/"):
            with self.assertRaises(ValueError):
                self.store.record(event(path=path))
        payload = event()
        payload["consent"] = False
        with self.assertRaises(ValueError):
            self.store.record(payload)

    def test_referrer_urls_rejected_and_raw_browser_id_not_stored(self):
        payload = event()
        browser = payload["browser_id"]
        payload["referrer_host"] = "https://example.org/secret?email=private"
        with self.assertRaises(ValueError):
            self.store.record(payload)
        payload["referrer_host"] = "example.org"
        self.store.record(payload)
        with closing(sqlite3.connect(self.store.path)) as db:
            stored = db.execute("SELECT browser FROM visits").fetchone()[0]
            self.assertNotEqual(stored, browser)
            self.assertEqual(len(stored), 64)
            self.assertEqual(len(db.execute("PRAGMA table_info(visits)").fetchall()), 7)

    def test_retention_purges_after_ninety_days(self):
        self.store.record(event())
        self.now += timedelta(days=91)
        self.assertEqual(self.store.summary(30)["totals"]["pageviews"], 0)
        with closing(sqlite3.connect(self.store.path)) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM visits").fetchone()[0], 0)

    def test_invalid_range_and_uuid_rejected(self):
        with self.assertRaises(ValueError):
            self.store.summary(365)
        payload = event()
        payload["browser_id"] = "not-random"
        with self.assertRaises(ValueError):
            self.store.record(payload)


class AuthTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "owner.json"
        self.record = analytics.credential_record("owner-test", PASSWORD)
        self.path.write_text(json.dumps(self.record), encoding="utf-8")
        self.clock = 0
        self.auth = analytics.OwnerAuth(self.path, clock=lambda: self.clock)

    def test_salted_password_and_independent_workspace_credentials(self):
        self.assertNotIn(PASSWORD, self.path.read_text())
        self.assertNotEqual(self.record["digest"], hashlib.sha256(PASSWORD.encode()).hexdigest())
        self.assertNotEqual(self.record["digest"], analytics.credential_record("owner-test", PASSWORD)["digest"])
        self.assertFalse(self.auth.login("someone-else", PASSWORD))
        self.assertTrue(self.auth.login("owner-test", PASSWORD))

    def test_idle_expiry_and_logout(self):
        token = self.auth.login("owner-test", PASSWORD)
        self.assertTrue(self.auth.valid(token))
        self.clock += 1801
        self.assertFalse(self.auth.valid(token))
        token = self.auth.login("owner-test", PASSWORD)
        self.auth.logout(token)
        self.assertFalse(self.auth.valid(token))

    def test_absolute_expiry_despite_activity(self):
        token = self.auth.login("owner-test", PASSWORD)
        for _ in range(48):
            self.clock += 899
            self.assertTrue(self.auth.valid(token))
        self.clock += 100
        self.assertFalse(self.auth.valid(token))

    def test_login_throttle_cannot_be_bypassed_by_changing_usernames(self):
        for i in range(8):
            self.assertFalse(self.auth.login("wrong-" + str(i), "bad-password"))
        with self.assertRaises(PermissionError):
            self.auth.login("owner-test", PASSWORD)
        self.clock = 601
        self.assertTrue(self.auth.login("owner-test", PASSWORD))

    def test_missing_or_corrupt_config_fails_closed(self):
        self.path.write_text('{"algorithm":"pbkdf2_sha256"}', encoding="utf-8")
        auth = analytics.OwnerAuth(self.path)
        self.assertFalse(auth.config)
        self.assertFalse(auth.valid("fake"))
        with self.assertRaises(RuntimeError):
            auth.login("owner-test", PASSWORD)


class EndpointTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        private = Path(self.temp.name)
        (private / "owner.json").write_text(json.dumps(analytics.credential_record("owner-test", PASSWORD)), encoding="utf-8")
        self.server = analytics.make_server("127.0.0.1", 0, private)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop)
        self.base = "http://127.0.0.1:" + str(self.server.server_port)

    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def call(self, path, payload=None, token="", origin="https://minun001.github.io", method=None):
        headers = {"Content-Type": "application/json"}
        if origin is not None:
            headers["Origin"] = origin
        if token:
            headers["Authorization"] = "Bearer " + token
        req = request.Request(self.base + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers, method=method)
        try:
            response = request.urlopen(req, timeout=10)
        except error.HTTPError as failure:
            response = failure
        with response:
            data = response.read()
            return response.status, json.loads(data) if data else {}, response.headers

    def login(self):
        return self.call("/analytics/login", {"username": "owner-test", "password": PASSWORD})[1]["session_token"]

    def test_stats_require_server_side_auth_and_logout_revokes_token(self):
        self.assertEqual(self.call("/analytics/summary?days=7")[0], 401)
        self.assertEqual(self.call("/analytics/summary?token=fake")[0], 401)
        token = self.login()
        code, data, headers = self.call("/analytics/summary?days=7", token=token)
        self.assertEqual(code, 200)
        self.assertEqual(len(data["daily"]), 7)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.call("/analytics/logout", {}, token=token)
        self.assertEqual(self.call("/analytics/summary", token=token)[0], 401)

    def test_collect_is_public_but_cors_is_exact_and_origin_required(self):
        payload = event()
        self.assertEqual(self.call("/analytics/collect", payload, origin=None)[0], 403)
        code, _, headers = self.call("/analytics/collect", payload, origin="https://attacker.example")
        self.assertEqual(code, 403)
        self.assertIsNone(headers.get("Access-Control-Allow-Origin"))
        code, _, headers = self.call("/analytics/collect", payload)
        self.assertEqual(code, 202)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "https://minun001.github.io")
        self.assertNotEqual(headers["Access-Control-Allow-Origin"], "*")
        data = self.call("/analytics/summary", token=self.login())[1]
        self.assertEqual(data["totals"]["pageviews"], 1)

    def test_private_files_health_and_bad_payloads_do_not_expose_secrets(self):
        for path in ("/.private/analytics/owner.json", "/tools/workspace_auth.local.json", "/visits.sqlite3"):
            self.assertEqual(self.call(path)[0], 404)
        health = self.call("/health")[1]
        self.assertEqual(set(health), {"ok", "service", "configured"})
        self.assertEqual(self.call("/analytics/login", {"username": [], "password": PASSWORD})[0], 400)
        self.assertEqual(self.call("/analytics/collect", {"x": "x" * 5000})[0], 400)
        self.assertEqual(self.call("/analytics/summary?days=999", token=self.login())[0], 400)

    def test_rate_limit(self):
        payload = event()
        for _ in range(60):
            self.assertEqual(self.call("/analytics/collect", payload)[0], 202)
        self.assertEqual(self.call("/analytics/collect", payload)[0], 429)

    def test_restart_invalidates_sessions_and_remote_bind_is_rejected(self):
        token = self.login()
        other = analytics.OwnerAuth(self.server.auth.path)
        self.assertFalse(other.valid(token))
        with self.assertRaises(ValueError):
            analytics.make_server("0.0.0.0", 0, Path(self.temp.name))


if __name__ == "__main__":
    unittest.main()
