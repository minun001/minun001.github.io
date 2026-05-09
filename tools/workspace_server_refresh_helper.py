from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import secrets
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import workspace_server_sync


TOOLS_DIR = Path(__file__).resolve().parent
SYNC_ROOT = TOOLS_DIR.parent
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
DEFAULT_STATIC_ROOT = SYNC_ROOT / "_site"
LOGIN_FAILURE_LIMIT = 8
LOGIN_FAILURE_WINDOW_SECONDS = 10 * 60
SESSION_COOKIE_NAME = "workspace_local_session"
PRIVATE_TOOL_FILES = {
    "/tools/workspace_content.json": TOOLS_DIR / "workspace_content.json",
    "/tools/workspace_server_sync_fallback.json": TOOLS_DIR / "workspace_server_sync_fallback.json",
    "/tools/workspace_site_signals.json": TOOLS_DIR / "workspace_site_signals.json",
}


def resolve_default_config_path() -> Path:
    env_path = os.environ.get("WORKSPACE_SERVER_CONFIG_PATH", "").strip()
    if env_path:
        return Path(env_path).expanduser().resolve()

    local_config = TOOLS_DIR / "workspace_servers.local.json"
    if local_config.exists():
        return local_config

    parent_config = SYNC_ROOT.parent / "tools" / "workspace_servers.local.json"
    if parent_config.exists():
        return parent_config

    return TOOLS_DIR / "workspace_servers.example.json"


def resolve_default_auth_config_path() -> Path:
    env_path = os.environ.get("WORKSPACE_AUTH_CONFIG_PATH", "").strip()
    if env_path:
        return Path(env_path).expanduser().resolve()

    local_config = TOOLS_DIR / "workspace_auth.local.json"
    if local_config.exists():
        return local_config

    parent_config = SYNC_ROOT.parent / "tools" / "workspace_auth.local.json"
    if parent_config.exists():
        return parent_config

    return TOOLS_DIR / "workspace_auth.local.json"


def json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def js_bytes(source: str) -> bytes:
    return source.encode("utf-8")


class RefreshState:
    def __init__(self, config_path: Path, auth_config_path: Path, fallback_output: Path | None, static_root: Path) -> None:
        self.config_path = config_path
        self.auth_config_path = auth_config_path
        self.fallback_output = fallback_output
        self.static_root = static_root
        self.lock = threading.Lock()
        self.session_lock = threading.Lock()
        self.sessions: dict[str, dict[str, Any]] = {}
        self.login_attempts_lock = threading.Lock()
        self.login_attempts: dict[str, list[float]] = {}

    def load_auth_config(self) -> dict[str, Any]:
        if not self.auth_config_path.exists():
            return {}
        try:
            payload = json.loads(self.auth_config_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return {}
        return payload if isinstance(payload, dict) else {}

    def auth_email(self) -> str:
        config = self.load_auth_config()
        return str(config.get("email") or "").strip().lower()

    def allows_any_email(self) -> bool:
        config = self.load_auth_config()
        return bool(config.get("allow_any_email")) or not self.auth_email()

    def auth_configured(self) -> bool:
        config = self.load_auth_config()
        digest = str(config.get("password_sha256") or "").strip().lower()
        return len(digest) == 64 and all(character in "0123456789abcdef" for character in digest)

    def session_seconds(self) -> int:
        config = self.load_auth_config()
        try:
            minutes = int(config.get("session_minutes") or 180)
        except (TypeError, ValueError):
            minutes = 180
        return max(5, min(minutes, 24 * 60)) * 60

    def verify_password(self, email: str, password: str) -> bool:
        config = self.load_auth_config()
        expected_email = self.auth_email()
        expected_digest = str(config.get("password_sha256") or "").strip().lower()
        if not self.auth_configured():
            return False
        if not self.allows_any_email() and str(email or "").strip().lower() != expected_email:
            return False
        password_digest = hashlib.sha256(str(password or "").encode("utf-8")).hexdigest()
        return secrets.compare_digest(password_digest, expected_digest)

    def create_session(self, email: str) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = time.time() + self.session_seconds()
        session_email = str(email or self.auth_email() or "workspace-user").strip().lower()
        with self.session_lock:
            self.sessions[token] = {"expires_at": expires_at, "email": session_email}
        return token

    def destroy_session(self, token: str) -> None:
        if not token:
            return
        with self.session_lock:
            self.sessions.pop(token, None)

    def get_session(self, token: str) -> dict[str, Any] | None:
        if not token:
            return None
        now = time.time()
        with self.session_lock:
            session = self.sessions.get(token)
            if not session:
                return None
            expires_at = float(session.get("expires_at") or 0)
            if expires_at <= now:
                self.sessions.pop(token, None)
                return None
            return session

    def is_valid_session(self, token: str) -> bool:
        return self.get_session(token) is not None

    def session_email(self, token: str) -> str:
        session = self.get_session(token)
        if not session:
            return ""
        return str(session.get("email") or "").strip().lower()

    def login_attempt_key(self, client_host: str, email: str) -> str:
        normalized_email = str(email or "").strip().lower() or "<blank>"
        return f"{client_host}|{normalized_email}"

    def is_login_limited(self, key: str) -> bool:
        now = time.time()
        cutoff = now - LOGIN_FAILURE_WINDOW_SECONDS
        with self.login_attempts_lock:
            attempts = [timestamp for timestamp in self.login_attempts.get(key, []) if timestamp >= cutoff]
            self.login_attempts[key] = attempts
            return len(attempts) >= LOGIN_FAILURE_LIMIT

    def record_login_failure(self, key: str) -> None:
        now = time.time()
        cutoff = now - LOGIN_FAILURE_WINDOW_SECONDS
        with self.login_attempts_lock:
            attempts = [timestamp for timestamp in self.login_attempts.get(key, []) if timestamp >= cutoff]
            attempts.append(now)
            self.login_attempts[key] = attempts

    def clear_login_failures(self, key: str) -> None:
        with self.login_attempts_lock:
            self.login_attempts.pop(key, None)


class WorkspaceRefreshHandler(BaseHTTPRequestHandler):
    server_version = "WorkspaceServerRefreshHelper/1.0"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))

    def write_json(self, status: int, payload: dict[str, Any]) -> None:
        data = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def write_javascript(self, status: int, source: str) -> None:
        data = js_bytes(source)
        self.send_response(status)
        self.send_header("Content-Type", "application/javascript; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(min(length, 1024 * 32))
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {}
        return payload if isinstance(payload, dict) else {}

    def get_cookie_value(self, name: str) -> str:
        cookie_header = self.headers.get("Cookie") or ""
        for part in cookie_header.split(";"):
            key, separator, value = part.strip().partition("=")
            if separator and key == name:
                return value.strip()
        return ""

    def get_bearer_token(self) -> str:
        header = self.headers.get("Authorization") or ""
        scheme, separator, value = header.partition(" ")
        if separator and scheme.lower() == "bearer":
            return value.strip()
        return ""

    def get_session_token(self) -> str:
        return self.get_bearer_token() or self.get_cookie_value(SESSION_COOKIE_NAME)

    def is_authenticated(self) -> bool:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        return state.is_valid_session(self.get_session_token())

    def require_authenticated(self) -> bool:
        if self.is_authenticated():
            return True
        self.write_json(401, {"ok": False, "error": "Local workspace login required."})
        return False

    def write_session_cookie(self, token: str, max_age: int) -> None:
        self.send_header(
            "Set-Cookie",
            f"{SESSION_COOKIE_NAME}={token}; Path=/; Max-Age={max_age}; HttpOnly; SameSite=Lax",
        )

    def write_clear_session_cookie(self) -> None:
        self.send_header(
            "Set-Cookie",
            f"{SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
        )

    def reject_non_loopback(self) -> bool:
        host = self.client_address[0]
        if host in {"127.0.0.1", "::1", "localhost"}:
            return False
        self.write_json(403, {"ok": False, "error": "Only loopback clients are allowed."})
        return True

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        if self.reject_non_loopback():
            return
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/refresh":
            self.handle_refresh(parsed.query)
            return
        if path == "/health":
            self.handle_health()
            return
        if path == "/local-auth/session":
            self.handle_auth_session()
            return
        self.serve_static(path)

    def handle_health(self) -> None:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        self.write_json(
            200,
            {
                "ok": True,
                "config_path": str(state.config_path),
                "auth_config_path": str(state.auth_config_path),
                "auth_configured": state.auth_configured(),
                "authenticated": self.is_authenticated(),
                "allow_any_email": state.allows_any_email(),
                "fallback_output": str(state.fallback_output) if state.fallback_output else "",
                "static_root": str(state.static_root),
            },
        )

    def local_workspace_config_source(self) -> str:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        config = {
            "provider": "local-helper",
            "sectionName": "Workspace",
            "masterEmail": state.auth_email(),
            "session": {"idleMinutes": max(1, state.session_seconds() // 60)},
            "analytics": {
                "visitsTable": "site_visits",
                "days": 14,
                "launchDate": "2025-11-14",
            },
            "dataFiles": {
                "content": "/tools/workspace_content.json",
                "serverSignals": "/tools/workspace_server_sync_fallback.json",
                "siteSignals": "/tools/workspace_site_signals.json",
            },
            "serverRefresh": {"endpoint": "/refresh"},
            "localAuth": {
                "sessionEndpoint": "/local-auth/session",
                "loginEndpoint": "/local-auth/login",
                "logoutEndpoint": "/local-auth/logout",
            },
        }
        return "window.WORKSPACE_AUTH_CONFIG = " + json.dumps(config, ensure_ascii=False, indent=2) + ";\n"

    def resolve_static_path(self, path: str) -> Path | None:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        static_root = state.static_root
        clean_path = unquote(path.split("?", 1)[0]).replace("\\", "/").lstrip("/")
        if not clean_path:
            clean_path = "index.html"
        candidate = (static_root / clean_path).resolve()
        if candidate.is_dir():
            candidate = candidate / "index.html"
        try:
            candidate.relative_to(static_root)
        except ValueError:
            return None
        return candidate

    def serve_static(self, path: str) -> None:
        clean_path = urlparse(path).path
        if clean_path == "/assets/workspace-config.js":
            self.write_javascript(200, self.local_workspace_config_source())
            return
        if clean_path in PRIVATE_TOOL_FILES:
            self.serve_private_tool_file(clean_path)
            return

        candidate = self.resolve_static_path(path)
        if not candidate or not candidate.exists() or not candidate.is_file():
            self.write_json(404, {"ok": False, "error": "Not found."})
            return

        data = candidate.read_bytes()
        content_type = mimetypes.guess_type(str(candidate))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_private_tool_file(self, path: str) -> None:
        if not self.require_authenticated():
            return
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        candidate = PRIVATE_TOOL_FILES[path]
        if path == "/tools/workspace_server_sync_fallback.json" and state.fallback_output and state.fallback_output.exists():
            candidate = state.fallback_output
        if not candidate.exists() or not candidate.is_file():
            self.write_json(404, {"ok": False, "error": "Private local file not found."})
            return

        data = candidate.read_bytes()
        content_type = mimetypes.guess_type(str(candidate))[0] or "application/json"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        if self.reject_non_loopback():
            return
        parsed = urlparse(self.path)
        if parsed.path == "/refresh":
            self.handle_refresh(parsed.query)
            return
        if parsed.path == "/local-auth/login":
            self.handle_auth_login()
            return
        if parsed.path == "/local-auth/logout":
            self.handle_auth_logout()
            return
        self.write_json(404, {"ok": False, "error": "Not found."})

    def handle_auth_session(self) -> None:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        authenticated = self.is_authenticated()
        token = self.get_session_token()
        self.write_json(
            200,
            {
                "ok": True,
                "configured": state.auth_configured(),
                "authenticated": authenticated,
                "email": state.session_email(token) if authenticated else "",
                "allowAnyEmail": state.allows_any_email(),
                "sessionMinutes": max(1, state.session_seconds() // 60),
            },
        )

    def handle_auth_login(self) -> None:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        payload = self.read_json_body()
        email = str(payload.get("email") or "").strip()
        password = str(payload.get("password") or "")
        login_key = state.login_attempt_key(self.client_address[0], email)
        if not state.auth_configured():
            self.write_json(503, {"ok": False, "error": "Local workspace password is not configured."})
            return
        if state.is_login_limited(login_key):
            self.write_json(429, {"ok": False, "error": "Too many login attempts. Wait a few minutes, then try again."})
            return
        if not state.verify_password(email, password):
            state.record_login_failure(login_key)
            self.write_json(401, {"ok": False, "error": "Invalid local workspace credentials."})
            return

        state.clear_login_failures(login_key)
        session_email = email if state.allows_any_email() else state.auth_email()
        token = state.create_session(session_email)
        data = json_bytes(
            {
                "ok": True,
                "email": session_email,
                "sessionToken": token,
                "sessionMinutes": max(1, state.session_seconds() // 60),
            }
        )
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.write_session_cookie(token, state.session_seconds())
        self.end_headers()
        self.wfile.write(data)

    def handle_auth_logout(self) -> None:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        state.destroy_session(self.get_session_token())
        data = json_bytes({"ok": True})
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.write_clear_session_cookie()
        self.end_headers()
        self.wfile.write(data)

    def handle_refresh(self, raw_query: str) -> None:
        if not self.require_authenticated():
            return
        query = parse_qs(raw_query)
        alias = (query.get("alias") or [""])[0].strip() or None
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]

        if not state.lock.acquire(timeout=240):
            self.write_json(503, {"ok": False, "error": "A server refresh is already running."})
            return

        try:
            payload = workspace_server_sync.collect_payload(state.config_path, alias)
            public_payload = workspace_server_sync.build_public_payload(payload, include_private_details=True)
            if state.fallback_output:
                workspace_server_sync.write_payload_file(state.fallback_output, payload)
            self.write_json(200, {"ok": True, **public_payload})
        except Exception as error:  # noqa: BLE001
            sys.stderr.write(f"Refresh failed: {error}\n")
            self.write_json(500, {"ok": False, "error": "Unable to refresh server signals."})
        finally:
            state.lock.release()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Local-only helper for Workspace server refresh button.")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Bind host. Keep this on 127.0.0.1 for local-only use.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Bind port.")
    parser.add_argument("--config", help="Path to the private workspace server config JSON.")
    parser.add_argument("--auth-config", help="Path to the private local workspace auth JSON.")
    parser.add_argument(
        "--fallback-output",
        default="",
        help="Optional public fallback JSON path to update after a successful refresh.",
    )
    parser.add_argument(
        "--static-root",
        default=str(DEFAULT_STATIC_ROOT),
        help="Optional built-site directory to serve from the same local helper.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    host = str(args.host).strip() or DEFAULT_HOST
    if host not in {"127.0.0.1", "localhost", "::1"}:
        raise SystemExit("Refusing to bind outside loopback. Use 127.0.0.1, localhost, or ::1.")

    config_path = Path(args.config).expanduser().resolve() if args.config else resolve_default_config_path()
    auth_config_path = Path(args.auth_config).expanduser().resolve() if args.auth_config else resolve_default_auth_config_path()
    fallback_output = Path(args.fallback_output).expanduser().resolve() if str(args.fallback_output).strip() else None
    static_root = Path(args.static_root).expanduser().resolve()
    if not config_path.exists():
        raise SystemExit(f"Workspace server config not found: {config_path}")
    if not static_root.exists():
        raise SystemExit(f"Built site directory not found: {static_root}. Run `bundle exec jekyll build` first.")

    server = ThreadingHTTPServer((host, args.port), WorkspaceRefreshHandler)
    server.refresh_state = RefreshState(  # type: ignore[attr-defined]
        config_path=config_path,
        auth_config_path=auth_config_path,
        fallback_output=fallback_output,
        static_root=static_root,
    )
    print(f"Workspace refresh helper listening on http://{host}:{args.port}")
    print(f"Config: {config_path}")
    print(f"Auth config: {auth_config_path}")
    print(f"Static site: {static_root}")
    if fallback_output:
        print(f"Fallback output: {fallback_output}")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
