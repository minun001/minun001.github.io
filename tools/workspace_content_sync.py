from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TOOLS_DIR = Path(__file__).resolve().parent
DEFAULT_CONTENT_PATH = TOOLS_DIR / "workspace_content.json"
PUBLIC_WORKSPACE_CONFIG_PATH = TOOLS_DIR.parent / "assets" / "workspace-config.js"

TABLE_SPECS: dict[str, dict[str, Any]] = {
    "workspace_dashboard_metrics": {
        "key": "label",
        "fields": ["label", "value", "context", "sort_order", "is_active"],
    },
    "workspace_links": {
        "key": "title",
        "fields": ["title", "description", "url", "tag", "sort_order", "is_active"],
    },
    "workspace_notes": {
        "key": "title",
        "fields": ["title", "body", "pinned", "sort_order", "is_active"],
        "touch_updated_at": True,
    },
}


def load_public_workspace_config() -> dict[str, str]:
    if not PUBLIC_WORKSPACE_CONFIG_PATH.exists():
        return {}
    text = PUBLIC_WORKSPACE_CONFIG_PATH.read_text(encoding="utf-8")
    url_match = re.search(r"supabaseUrl:\s*'([^']+)'", text)
    anon_key_match = re.search(r"supabaseAnonKey:\s*'([^']+)'", text)
    return {
        "supabase_url": url_match.group(1).strip() if url_match else "",
        "supabase_anon_key": anon_key_match.group(1).strip() if anon_key_match else "",
    }


def resolve_supabase_auth() -> tuple[str, str, str, str]:
    public_config = load_public_workspace_config()
    supabase_url = os.environ.get("WORKSPACE_SUPABASE_URL", "").strip() or public_config.get("supabase_url", "")
    service_role_key = os.environ.get("WORKSPACE_SUPABASE_SERVICE_ROLE_KEY", "").strip()
    access_token = os.environ.get("WORKSPACE_SUPABASE_ACCESS_TOKEN", "").strip()
    anon_key = (
        os.environ.get("WORKSPACE_SUPABASE_ANON_KEY", "").strip()
        or os.environ.get("SUPABASE_ANON_KEY", "").strip()
        or public_config.get("supabase_anon_key", "")
    )

    if supabase_url and service_role_key:
        return supabase_url, service_role_key, service_role_key, "service_role"
    if supabase_url and anon_key and access_token:
        return supabase_url, anon_key, access_token, "session_token"
    return supabase_url, "", "", ""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def normalize_optional_text(value: Any) -> str | None:
    text = normalize_text(value)
    return text or None


def normalize_bool(value: Any) -> bool:
    return bool(value)


def normalize_int(value: Any, default: int = 100) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def resolve_content_path(cli_value: str | None) -> Path:
    if cli_value:
        return Path(cli_value).expanduser().resolve()
    return DEFAULT_CONTENT_PATH


def load_content(path: Path) -> dict[str, list[dict[str, Any]]]:
    if not path.exists():
        raise FileNotFoundError(f"Content file not found: {path}")
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("Workspace content JSON must contain a top-level object.")

    metrics = []
    for index, item in enumerate(raw.get("workspace_dashboard_metrics", [])):
        if not isinstance(item, dict):
            continue
        label = normalize_text(item.get("label"))
        value = normalize_text(item.get("value"))
        if not label or not value:
            continue
        metrics.append(
            {
                "label": label,
                "value": value,
                "context": normalize_optional_text(item.get("context")),
                "sort_order": normalize_int(item.get("sort_order"), (index + 1) * 10),
                "is_active": normalize_bool(item.get("is_active", True)),
            }
        )

    links = []
    for index, item in enumerate(raw.get("workspace_links", [])):
        if not isinstance(item, dict):
            continue
        title = normalize_text(item.get("title"))
        url = normalize_text(item.get("url"))
        if not title or not url:
            continue
        links.append(
            {
                "title": title,
                "description": normalize_optional_text(item.get("description")),
                "url": url,
                "tag": normalize_text(item.get("tag")) or "Open",
                "sort_order": normalize_int(item.get("sort_order"), (index + 1) * 10),
                "is_active": normalize_bool(item.get("is_active", True)),
            }
        )

    notes = []
    for index, item in enumerate(raw.get("workspace_notes", [])):
        if not isinstance(item, dict):
            continue
        title = normalize_text(item.get("title"))
        body = normalize_text(item.get("body"))
        if not title or not body:
            continue
        notes.append(
            {
                "title": title,
                "body": body,
                "pinned": normalize_bool(item.get("pinned", False)),
                "sort_order": normalize_int(item.get("sort_order"), (index + 1) * 10),
                "is_active": normalize_bool(item.get("is_active", True)),
            }
        )

    return {
        "workspace_dashboard_metrics": metrics,
        "workspace_links": links,
        "workspace_notes": notes,
    }


def request_json(
    base_url: str,
    api_key: str,
    auth_token: str,
    table: str,
    method: str = "GET",
    query: dict[str, str] | None = None,
    payload: Any | None = None,
    prefer: str | None = None,
) -> Any:
    query_string = urlencode(query or {})
    url = f"{base_url.rstrip('/')}/rest/v1/{table}"
    if query_string:
        url += f"?{query_string}"
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {auth_token}",
    }
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer
    request = Request(url, data=data, headers=headers, method=method)
    with urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8").strip()
    if not body:
        return None
    return json.loads(body)


def fetch_existing_rows(base_url: str, api_key: str, auth_token: str, table: str, fields: list[str]) -> list[dict[str, Any]]:
    select_columns = ["id"] + fields
    return request_json(
        base_url,
        api_key,
        auth_token,
        table,
        query={
            "select": ",".join(select_columns),
            "order": "id.asc",
        },
    ) or []


def compare_field(field: str, existing_value: Any, desired_value: Any) -> bool:
    if field in {"sort_order"}:
        return normalize_int(existing_value) == normalize_int(desired_value)
    if field in {"pinned", "is_active"}:
        return normalize_bool(existing_value) == normalize_bool(desired_value)
    return normalize_optional_text(existing_value) == normalize_optional_text(desired_value)


def build_table_plan(table: str, desired_rows: list[dict[str, Any]], existing_rows: list[dict[str, Any]]) -> dict[str, Any]:
    spec = TABLE_SPECS[table]
    key_field = spec["key"]
    fields = spec["fields"]
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for row in sorted(existing_rows, key=lambda item: int(item.get("id") or 0)):
        key = normalize_text(row.get(key_field))
        if not key:
            continue
        groups[key].append(row)

    inserts: list[dict[str, Any]] = []
    updates: list[dict[str, Any]] = []
    deactivations: list[dict[str, Any]] = []

    for desired in desired_rows:
        key = normalize_text(desired.get(key_field))
        matches = groups.pop(key, [])
        primary = matches[0] if matches else None
        extras = matches[1:]

        if primary is None:
            inserts.append(desired)
        else:
            changes: dict[str, Any] = {}
            for field in fields:
                if not compare_field(field, primary.get(field), desired.get(field)):
                    changes[field] = desired.get(field)
            if changes and spec.get("touch_updated_at"):
                changes["updated_at"] = utc_now()
            if changes:
                updates.append({"id": primary["id"], "key": key, "changes": changes})
            for extra in extras:
                if normalize_bool(extra.get("is_active", True)):
                    deactivations.append({"id": extra["id"], "key": key, "changes": {"is_active": False}})

    for remaining_key, rows in groups.items():
        for row in rows:
            if normalize_bool(row.get("is_active", True)):
                deactivations.append({"id": row["id"], "key": remaining_key, "changes": {"is_active": False}})

    return {
        "table": table,
        "desired_count": len(desired_rows),
        "existing_count": len(existing_rows),
        "inserts": inserts,
        "updates": updates,
        "deactivations": deactivations,
    }


def build_sync_plan(content: dict[str, list[dict[str, Any]]], remote_rows: dict[str, list[dict[str, Any]]] | None) -> dict[str, Any]:
    tables: dict[str, Any] = {}
    for table in TABLE_SPECS:
        desired_rows = content.get(table, [])
        existing_rows = remote_rows.get(table, []) if remote_rows else []
        tables[table] = build_table_plan(table, desired_rows, existing_rows)
    return {"tables": tables}


def patch_row(base_url: str, api_key: str, auth_token: str, table: str, row_id: int, changes: dict[str, Any]) -> None:
    request_json(
        base_url,
        api_key,
        auth_token,
        table,
        method="PATCH",
        query={"id": f"eq.{row_id}"},
        payload=changes,
        prefer="return=minimal",
    )


def insert_rows(base_url: str, api_key: str, auth_token: str, table: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    request_json(
        base_url,
        api_key,
        auth_token,
        table,
        method="POST",
        payload=rows,
        prefer="return=minimal",
    )


def apply_sync_plan(base_url: str, api_key: str, auth_token: str, plan: dict[str, Any]) -> dict[str, int]:
    totals = {"inserted": 0, "updated": 0, "deactivated": 0}
    for table, table_plan in plan["tables"].items():
        insert_rows(base_url, api_key, auth_token, table, table_plan["inserts"])
        totals["inserted"] += len(table_plan["inserts"])
        for update in table_plan["updates"]:
            patch_row(base_url, api_key, auth_token, table, int(update["id"]), update["changes"])
        totals["updated"] += len(table_plan["updates"])
        for deactivate in table_plan["deactivations"]:
            patch_row(base_url, api_key, auth_token, table, int(deactivate["id"]), deactivate["changes"])
        totals["deactivated"] += len(table_plan["deactivations"])
    return totals


def build_dry_run_report(
    content_path: Path,
    content: dict[str, list[dict[str, Any]]],
    plan: dict[str, Any] | None,
    remote_available: bool,
) -> dict[str, Any]:
    report = {
        "content_path": str(content_path),
        "generated_at": utc_now(),
        "remote_diff_available": remote_available,
        "tables": {},
    }
    if not remote_available:
        report["note"] = "A write-capable Supabase auth path is unavailable. Set WORKSPACE_SUPABASE_SERVICE_ROLE_KEY, or set WORKSPACE_SUPABASE_ACCESS_TOKEN with an anon key available in env or assets/workspace-config.js."
        for table, rows in content.items():
            report["tables"][table] = {"desired_count": len(rows)}
        return report

    for table, table_plan in (plan or {}).get("tables", {}).items():
        key_field = TABLE_SPECS[table]["key"]
        report["tables"][table] = {
            "desired_count": table_plan["desired_count"],
            "existing_count": table_plan["existing_count"],
            "insert_keys": [row[key_field] for row in table_plan["inserts"]],
            "update_keys": [row["key"] for row in table_plan["updates"]],
            "deactivate_keys": [row["key"] for row in table_plan["deactivations"]],
        }
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync canonical workspace content into Supabase.")
    parser.add_argument("--content", help="Optional path to workspace content JSON.")
    parser.add_argument("--dry-run", action="store_true", help="Print the sync plan without writing to Supabase.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    content_path = resolve_content_path(args.content)
    content = load_content(content_path)

    supabase_url, api_key, auth_token, auth_mode = resolve_supabase_auth()
    has_remote_credentials = bool(supabase_url and api_key and auth_token)

    if args.dry_run and not has_remote_credentials:
        json.dump(build_dry_run_report(content_path, content, None, False), sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    if not has_remote_credentials:
        raise SystemExit(
            "Supabase write auth is required unless --dry-run is used. "
            "Set WORKSPACE_SUPABASE_SERVICE_ROLE_KEY, or set WORKSPACE_SUPABASE_ACCESS_TOKEN "
            "with an anon key available in env or assets/workspace-config.js."
        )

    remote_rows = {
        table: fetch_existing_rows(supabase_url, api_key, auth_token, table, spec["fields"])
        for table, spec in TABLE_SPECS.items()
    }
    plan = build_sync_plan(content, remote_rows)

    if args.dry_run:
        json.dump(build_dry_run_report(content_path, content, plan, True), sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    totals = apply_sync_plan(supabase_url, api_key, auth_token, plan)
    print(
        "Synced workspace content from "
        f"{content_path} using {auth_mode}: inserted {totals['inserted']}, "
        f"updated {totals['updated']}, deactivated {totals['deactivated']}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
