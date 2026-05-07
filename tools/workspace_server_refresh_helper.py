from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import threading
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


def json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


class RefreshState:
    def __init__(self, config_path: Path, fallback_output: Path | None, static_root: Path) -> None:
        self.config_path = config_path
        self.fallback_output = fallback_output
        self.static_root = static_root
        self.lock = threading.Lock()


class WorkspaceRefreshHandler(BaseHTTPRequestHandler):
    server_version = "WorkspaceServerRefreshHelper/1.0"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
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
        self.serve_static(path)

    def handle_health(self) -> None:
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]
        self.write_json(
            200,
            {
                "ok": True,
                "config_path": str(state.config_path),
                "fallback_output": str(state.fallback_output) if state.fallback_output else "",
                "static_root": str(state.static_root),
            },
        )

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

    def do_POST(self) -> None:
        if self.reject_non_loopback():
            return
        parsed = urlparse(self.path)
        if parsed.path != "/refresh":
            self.write_json(404, {"ok": False, "error": "Not found."})
            return

        self.handle_refresh(parsed.query)

    def handle_refresh(self, raw_query: str) -> None:
        query = parse_qs(raw_query)
        alias = (query.get("alias") or [""])[0].strip() or None
        state: RefreshState = self.server.refresh_state  # type: ignore[attr-defined]

        if not state.lock.acquire(timeout=240):
            self.write_json(503, {"ok": False, "error": "A server refresh is already running."})
            return

        try:
            payload = workspace_server_sync.collect_payload(state.config_path, alias)
            public_payload = workspace_server_sync.build_public_payload(payload)
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
    fallback_output = Path(args.fallback_output).expanduser().resolve() if str(args.fallback_output).strip() else None
    static_root = Path(args.static_root).expanduser().resolve()
    if not config_path.exists():
        raise SystemExit(f"Workspace server config not found: {config_path}")
    if not static_root.exists():
        raise SystemExit(f"Built site directory not found: {static_root}. Run `bundle exec jekyll build` first.")

    server = ThreadingHTTPServer((host, args.port), WorkspaceRefreshHandler)
    server.refresh_state = RefreshState(  # type: ignore[attr-defined]
        config_path=config_path,
        fallback_output=fallback_output,
        static_root=static_root,
    )
    print(f"Workspace refresh helper listening on http://{host}:{args.port}")
    print(f"Config: {config_path}")
    print(f"Static site: {static_root}")
    if fallback_output:
        print(f"Fallback output: {fallback_output}")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
