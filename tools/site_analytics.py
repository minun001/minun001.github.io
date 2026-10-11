"""Private, consent-based site analytics. Standard library only; no static file server."""
from __future__ import annotations

import argparse
from collections import defaultdict
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import getpass
import hashlib
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import secrets
import sqlite3
import threading
import time
from urllib.parse import parse_qs, urlparse
from uuid import UUID

ROOT = Path(__file__).resolve().parent.parent
PRIVATE = ROOT / ".private" / "analytics"
KST = timezone(timedelta(hours=9))
PUBLIC_PATHS = ("/", "/profile/", "/research/", "/publications/", "/news/")
DEFAULT_ORIGINS = ("https://minun001.github.io", "http://127.0.0.1:4000", "http://localhost:4000", "http://127.0.0.1:8765")
ITERATIONS = 600_000
RETENTION_DAYS = 90


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="seconds")


def credential_record(username: str, password: str) -> dict:
    if not re.fullmatch(r"[A-Za-z0-9_.@-]{1,80}", username) or not 12 <= len(password) <= 256:
        raise ValueError("Use a valid username and a password of 12 to 256 characters.")
    salt = secrets.token_bytes(32)
    return {"username": username, "algorithm": "pbkdf2_sha256", "iterations": ITERATIONS,
            "salt": salt.hex(), "digest": hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS).hex()}


class AnalyticsStore:
    def __init__(self, path: Path, now=utc_now):
        self.path, self.now = path, now
        path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS visits (
                    event_id TEXT PRIMARY KEY, visited_at TEXT NOT NULL, day TEXT NOT NULL,
                    browser TEXT NOT NULL, page TEXT NOT NULL, referrer TEXT NOT NULL, device TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS visits_day ON visits(day);
                CREATE INDEX IF NOT EXISTS visits_browser ON visits(browser, day);
            """)
            db.execute("INSERT OR IGNORE INTO settings VALUES ('browser_salt', ?)", (secrets.token_hex(32),))
            db.execute("INSERT OR IGNORE INTO settings VALUES ('collection_started', ?)", (iso(now()),))
            self.salt = db.execute("SELECT value FROM settings WHERE key='browser_salt'").fetchone()[0]
            self.purge(db, now())

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def purge(self, db, now):
        db.execute("DELETE FROM visits WHERE visited_at < ?", (iso(now - timedelta(days=RETENTION_DAYS)),))

    def record(self, payload: dict) -> bool:
        if payload.get("consent") is not True or payload.get("page_path") not in PUBLIC_PATHS:
            raise ValueError("Consent and an allowed public page are required.")
        try:
            event = str(UUID(str(payload["event_id"])))
            browser_id = str(UUID(str(payload["browser_id"])))
        except (KeyError, ValueError, AttributeError):
            raise ValueError("Valid random event and browser IDs are required.") from None
        referrer = str(payload.get("referrer_host", "")).lower()
        if len(referrer) > 253 or (referrer and not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", referrer)):
            raise ValueError("Only a referrer hostname is accepted, not a URL.")
        device = payload.get("device", "unknown")
        if device not in ("mobile", "desktop", "unknown"):
            raise ValueError("Invalid device category.")
        # The database never retains the raw browser identifier supplied by the client.
        browser = hmac.new(bytes.fromhex(self.salt), browser_id.encode(), hashlib.sha256).hexdigest()
        now = self.now()
        with self.lock, self.connect() as db:
            self.purge(db, now)
            result = db.execute("INSERT OR IGNORE INTO visits VALUES (?,?,?,?,?,?,?)",
                                (event, iso(now), now.astimezone(KST).date().isoformat(), browser,
                                 payload["page_path"], referrer, device))
            return result.rowcount == 1

    def summary(self, days: int) -> dict:
        if days not in (7, 30):
            raise ValueError("Date range must be 7 or 30 days.")
        now = self.now()
        today = now.astimezone(KST).date()
        first = today - timedelta(days=days - 1)
        with self.lock, self.connect() as db:
            self.purge(db, now)
            daily_rows = db.execute("SELECT day, count(*) pageviews, count(DISTINCT browser) browsers FROM visits WHERE day>=? GROUP BY day", (str(first),)).fetchall()
            by_day = {row["day"]: dict(row) for row in daily_rows}
            daily = [{"date": str(first + timedelta(days=i)), "browsers": by_day.get(str(first + timedelta(days=i)), {}).get("browsers", 0), "pageviews": by_day.get(str(first + timedelta(days=i)), {}).get("pageviews", 0)} for i in range(days)]
            totals = dict(db.execute("SELECT count(*) pageviews, count(DISTINCT browser) browsers FROM visits WHERE day>=?", (str(first),)).fetchone())
            pages = [dict(row) for row in db.execute("SELECT page path,count(*) pageviews FROM visits WHERE day>=? GROUP BY page ORDER BY pageviews DESC,page LIMIT 20", (str(first),))]
            referrers = [dict(row) for row in db.execute("SELECT referrer host,count(*) pageviews FROM visits WHERE day>=? GROUP BY referrer ORDER BY pageviews DESC,referrer LIMIT 20", (str(first),))]
            recent = [{"timestamp": row["visited_at"], "browser": row["browser"][:12], "page": row["page"], "referrer": row["referrer"]} for row in db.execute("SELECT * FROM visits WHERE day>=? ORDER BY visited_at DESC,event_id LIMIT 100", (str(first),))]
            started = db.execute("SELECT value FROM settings WHERE key='collection_started'").fetchone()[0]
        return {"ok": True, "generated_at": iso(now), "collection_started": started, "timezone": "Asia/Seoul", "retention_days": RETENTION_DAYS,
                "today": {"browsers": daily[-1]["browsers"], "pageviews": daily[-1]["pageviews"]}, "totals": totals,
                "daily": daily, "pages": pages, "referrers": referrers, "recent": recent}


class OwnerAuth:
    def __init__(self, path: Path, clock=time.monotonic):
        self.path, self.clock = path, clock
        self.lock = threading.Lock()
        self.sessions = {}
        self.failures = []
        try:
            self.config = json.loads(path.read_text(encoding="utf-8"))
            if (self.config["algorithm"] != "pbkdf2_sha256" or
                    not ITERATIONS <= int(self.config["iterations"]) <= 2_000_000 or
                    len(bytes.fromhex(self.config["salt"])) != 32 or len(bytes.fromhex(self.config["digest"])) != 32 or
                    not isinstance(self.config["username"], str)):
                self.config = {}
            else:
                self.config["iterations"] = int(self.config["iterations"])
        except (OSError, ValueError, KeyError, TypeError):
            self.config = {}

    def login(self, username: str, password: str) -> str:
        with self.lock:
            now = self.clock()
            self.failures = [stamp for stamp in self.failures if stamp > now - 600]
            if len(self.failures) >= 8:
                raise PermissionError("Too many login attempts. Wait 10 minutes.")
            if not self.config:
                raise RuntimeError("Owner credentials are not configured on the API.")
            actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(self.config["salt"]), self.config["iterations"]).hex()
            valid = hmac.compare_digest(actual, self.config["digest"]) & hmac.compare_digest(username.encode(), self.config["username"].encode())
            if not valid:
                self.failures.append(now)
                return ""
            self.sessions = {key: value for key, value in self.sessions.items() if value[0] > now and value[1] > now}
            if len(self.sessions) >= 32:
                self.sessions.pop(next(iter(self.sessions)))
            token = secrets.token_urlsafe(32)
            self.sessions[hashlib.sha256(token.encode()).hexdigest()] = (now + 12 * 3600, now + 1800)
            return token

    def valid(self, token: str) -> bool:
        with self.lock:
            key = hashlib.sha256(token.encode()).hexdigest()
            session = self.sessions.get(key)
            now = self.clock()
            if not session or min(session) <= now:
                self.sessions.pop(key, None)
                return False
            self.sessions[key] = (session[0], now + 1800)
            return True

    def logout(self, token: str):
        with self.lock:
            self.sessions.pop(hashlib.sha256(token.encode()).hexdigest(), None)


class RateLimit:
    def __init__(self):
        self.lock = threading.Lock()
        self.buckets = defaultdict(list)

    def allow(self, key: str, maximum: int) -> bool:
        now = time.monotonic()
        with self.lock:
            if len(self.buckets) > 10000:
                self.buckets = defaultdict(list, {key: stamps for key, stamps in self.buckets.items() if stamps[-1] > now - 60})
                if len(self.buckets) > 10000:
                    return False
            stamps = [stamp for stamp in self.buckets[key] if stamp > now - 60]
            if len(stamps) >= maximum:
                self.buckets[key] = stamps
                return False
            self.buckets[key] = stamps + [now]
            return True


class AnalyticsHandler(BaseHTTPRequestHandler):
    server_version = "PrivateAnalytics/1.0"

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *_args):
        pass  # Do not retain access logs, IP addresses, query strings or login payloads.

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if origin in self.server.allowed_origins:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Vary", "Origin")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def send_json(self, code, payload):
        body = json.dumps(payload, allow_nan=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def origin_allowed(self):
        origin = self.headers.get("Origin")
        return origin is None or origin in self.server.allowed_origins

    def token(self):
        scheme, _, token = self.headers.get("Authorization", "").partition(" ")
        return token if scheme.lower() == "bearer" and len(token) <= 256 else ""

    def require_owner(self):
        if self.server.auth.valid(self.token()):
            return True
        self.send_json(401, {"ok": False, "error": "Owner sign-in required."})
        return False

    def body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid body length.") from None
        if not 0 < length <= 4096:
            raise ValueError("Request body must be between 1 and 4096 bytes.")
        if self.headers.get_content_type() != "application/json":
            raise ValueError("Use application/json.")
        try:
            payload = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            raise ValueError("Invalid JSON.") from None
        if not isinstance(payload, dict):
            raise ValueError("Expected a JSON object.")
        return payload

    def do_OPTIONS(self):
        self.send_response(204 if self.origin_allowed() else 403)
        self.end_headers()

    def do_GET(self):
        if not self.origin_allowed():
            self.send_json(403, {"ok": False, "error": "Origin not allowed."})
            return
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"ok": True, "service": "private-site-analytics", "configured": bool(self.server.auth.config)})
        elif parsed.path == "/analytics/session":
            self.send_json(200, {"ok": True, "configured": bool(self.server.auth.config), "authenticated": self.server.auth.valid(self.token())})
        elif parsed.path == "/analytics/summary":
            if self.require_owner():
                try:
                    days = int(parse_qs(parsed.query).get("days", ["30"])[0])
                    self.send_json(200, self.server.store.summary(days))
                except ValueError as error:
                    self.send_json(400, {"ok": False, "error": str(error)})
                except sqlite3.Error:
                    self.send_json(503, {"ok": False, "error": "Analytics storage is unavailable."})
        else:
            self.send_json(404, {"ok": False, "error": "Not found."})

    def do_POST(self):
        if not self.origin_allowed():
            self.send_json(403, {"ok": False, "error": "Origin not allowed."})
            return
        path = urlparse(self.path).path
        if path not in ("/analytics/login", "/analytics/logout", "/analytics/collect"):
            self.send_json(404, {"ok": False, "error": "Not found."})
            return
        try:
            if not self.server.limiter.allow("requests:" + self.client_address[0], 240):
                self.send_json(429, {"ok": False, "error": "Too many requests. Try later."})
                return
            payload = self.body()
            if path == "/analytics/collect":
                if self.headers.get("Origin") not in self.server.allowed_origins:
                    self.send_json(403, {"ok": False, "error": "A permitted browser Origin is required."})
                    return
                if not self.server.limiter.allow("collect:" + str(payload.get("browser_id", ""))[:80], 60):
                    self.send_json(429, {"ok": False, "error": "Collection rate exceeded."})
                    return
                created = self.server.store.record(payload)
                self.send_json(202, {"ok": True, "recorded": created})
            elif path == "/analytics/login":
                username, password = payload.get("username"), payload.get("password")
                if not isinstance(username, str) or not isinstance(password, str) or len(username) > 80 or len(password) > 256:
                    raise ValueError("Invalid credential format.")
                token = self.server.auth.login(username, password)
                self.send_json(200 if token else 401, {"ok": True, "session_token": token} if token else {"ok": False, "error": "Incorrect username or password."})
            elif self.require_owner():
                self.server.auth.logout(self.token())
                self.send_json(200, {"ok": True})
        except ValueError as error:
            self.send_json(400, {"ok": False, "error": str(error)})
        except PermissionError as error:
            self.send_json(429, {"ok": False, "error": str(error)})
        except RuntimeError as error:
            self.send_json(503, {"ok": False, "error": str(error)})
        except sqlite3.Error:
            self.send_json(503, {"ok": False, "error": "Analytics storage is unavailable."})


def make_server(host: str, port: int, private_dir: Path, origins=DEFAULT_ORIGINS):
    if host not in ("127.0.0.1", "localhost"):
        raise ValueError("Bind to loopback only. Publish through an HTTPS reverse proxy or tunnel.")
    if any(not (origin.startswith("https://") or origin.startswith(("http://localhost:", "http://127.0.0.1:"))) for origin in origins):
        raise ValueError("Only exact HTTPS or local development origins are allowed.")
    server = ThreadingHTTPServer((host, port), AnalyticsHandler)
    server.daemon_threads = True
    server.auth = OwnerAuth(private_dir / "owner.json")
    server.store = AnalyticsStore(private_dir / "visits.sqlite3")
    server.limiter = RateLimit()
    server.allowed_origins = tuple(origins)
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8792)
    parser.add_argument("--private-dir", type=Path, default=PRIVATE)
    parser.add_argument("--set-credentials", action="store_true")
    args = parser.parse_args()
    private_dir = args.private_dir.resolve()
    if private_dir.is_relative_to(ROOT / "_site"):
        parser.error("Private data must never be stored in the built site.")
    if args.set_credentials:
        username = input("Owner username: ").strip()
        password = getpass.getpass("Owner password: ")
        if password != getpass.getpass("Confirm password: "):
            raise SystemExit("Passwords do not match.")
        record = credential_record(username, password)
        private_dir.mkdir(parents=True, exist_ok=True)
        path = private_dir / "owner.json"
        path.write_text(json.dumps(record) + "\n", encoding="utf-8")
        path.chmod(0o600)
        print("Private owner credential hash saved. Restart the API to apply changes.")
        return
    server = make_server("127.0.0.1", args.port, private_dir)
    print(f"Analytics API on http://127.0.0.1:{args.port}. Publish through HTTPS, never a public HTTP port.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
