from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TOOLS_DIR = Path(__file__).resolve().parent
DEFAULT_LOCAL_CONFIG = TOOLS_DIR / "workspace_servers.local.json"
DEFAULT_EXAMPLE_CONFIG = TOOLS_DIR / "workspace_servers.example.json"
PUBLIC_WORKSPACE_CONFIG_PATH = TOOLS_DIR.parent / "assets" / "workspace-config.js"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


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


def load_config(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Config not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_config_path(cli_value: str | None) -> Path:
    if cli_value:
        return Path(cli_value).expanduser().resolve()
    env_path = os.environ.get("WORKSPACE_SERVER_CONFIG_PATH", "").strip()
    if env_path:
        return Path(env_path).expanduser().resolve()
    if DEFAULT_LOCAL_CONFIG.exists():
        return DEFAULT_LOCAL_CONFIG
    return DEFAULT_EXAMPLE_CONFIG


def derive_root_label(server: dict[str, Any]) -> str:
    explicit = str(server.get("root_label") or "").strip()
    if explicit:
        return explicit
    root = str(server.get("root") or "").strip()
    if not root:
        return "Workspace root"
    name = PurePosixPath(root).name.strip()
    return name or root


def active_servers(config: dict[str, Any], alias_filter: str | None) -> list[dict[str, Any]]:
    servers = config.get("servers", [])
    if not isinstance(servers, list):
        return []

    filtered: list[dict[str, Any]] = []
    for index, raw in enumerate(servers):
        if not isinstance(raw, dict):
            continue
        if raw.get("is_active") is False:
            continue
        alias = str(raw.get("alias") or "").strip()
        label = str(raw.get("label") or alias).strip()
        if not alias or not label:
            continue
        if alias_filter and alias_filter != alias:
            continue
        filtered.append(
            {
                "alias": alias,
                "label": label,
                "ssh_alias": str(raw.get("ssh_alias") or alias).strip() or alias,
                "root": str(raw.get("root") or "").strip(),
                "root_label": derive_root_label(raw),
                "projects": raw.get("projects") if isinstance(raw.get("projects"), list) else [],
                "sort_order": int(raw.get("sort_order") or ((index + 1) * 10)),
            }
        )
    return filtered


def build_probe_script(server: dict[str, Any]) -> str:
    root = json.dumps(server.get("root") or "/")
    projects = json.dumps(server.get("projects") or [])
    return f"""
import json
import os
import subprocess
import time
from datetime import datetime, timezone

root = {root}
projects = {projects}

def run(cmd):
    result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    return result.stdout.strip() if result.returncode == 0 else ""

def read_cpu_times():
    with open("/proc/stat", "r", encoding="utf-8") as handle:
        values = [int(item) for item in handle.readline().split()[1:]]
    idle = values[3] + values[4]
    total = sum(values)
    return idle, total

def cpu_usage_percent():
    try:
        idle1, total1 = read_cpu_times()
        time.sleep(0.2)
        idle2, total2 = read_cpu_times()
        total_delta = total2 - total1
        idle_delta = idle2 - idle1
        if total_delta <= 0:
            return 0.0
        return round(100.0 * (1 - idle_delta / total_delta), 1)
    except Exception:
        return 0.0

def meminfo():
    data = {{}}
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as handle:
            for line in handle:
                key, raw = line.split(":", 1)
                data[key] = int(raw.strip().split()[0])
    except Exception:
        return {{"used_mb": 0.0, "total_mb": 0.0, "usage_percent": 0.0}}
    total = data.get("MemTotal", 0) / 1024
    available = data.get("MemAvailable", 0) / 1024
    used = total - available
    usage = round((used / total) * 100, 1) if total else 0.0
    return {{
        "used_mb": round(used, 1),
        "total_mb": round(total, 1),
        "usage_percent": usage,
    }}

def loadavg():
    try:
        one, five, fifteen = os.getloadavg()
        return {{"one": round(one, 2), "five": round(five, 2), "fifteen": round(fifteen, 2)}}
    except Exception:
        return {{"one": 0.0, "five": 0.0, "fifteen": 0.0}}

def cpu_model():
    try:
        with open("/proc/cpuinfo", "r", encoding="utf-8") as handle:
            for line in handle:
                if line.lower().startswith("model name"):
                    return line.split(":", 1)[1].strip()
    except Exception:
        return ""
    return ""

def parse_optional_float(raw, default=0.0):
    if raw is None:
        return default
    value = str(raw).strip()
    if not value or value in ("[N/A]", "N/A", "-", "nan", "None"):
        return default
    try:
        return float(value)
    except Exception:
        return default

def parse_optional_text(raw, default=None):
    if raw is None:
        return default
    value = str(raw).strip()
    if not value or value in ("[N/A]", "N/A", "-"):
        return default
    return value

def disk_info(path):
    if not path:
        return {{"used_text": "", "percent": 0.0}}
    output = run("df -h " + path.replace('"', '\\"'))
    lines = [line for line in output.splitlines() if line.strip()]
    if len(lines) > 1:
        parts = lines[-1].split()
        if len(parts) >= 5:
            return {{
                "used_text": f"{{parts[2]}} used of {{parts[1]}} ({{parts[4]}})",
                "percent": parse_optional_float(parts[4].replace("%", ""), 0.0),
            }}
    return {{"used_text": "", "percent": 0.0}}

def gpu_devices():
    output = run("nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu,memory.total,memory.used,power.draw,power.limit --format=csv,noheader,nounits")
    devices = []
    for line in output.splitlines():
        parts = [part.strip() for part in line.split(",")]
        if len(parts) < 8:
            continue
        memory_total = parse_optional_float(parts[4], 0.0)
        memory_used = parse_optional_float(parts[5], 0.0)
        memory_percent = round((memory_used / memory_total) * 100, 1) if memory_total else 0.0
        devices.append(
            {{
                "index": parts[0],
                "name": parts[1],
                "temperature_c": parse_optional_text(parts[2]),
                "utilization_percent": parse_optional_float(parts[3], 0.0),
                "memory_total_mb": memory_total,
                "memory_used_mb": memory_used,
                "memory_percent": memory_percent,
                "power_draw_w": parse_optional_text(parts[6]),
                "power_limit_w": parse_optional_text(parts[7]),
            }}
        )
    return devices

def gpu_processes():
    output = run("nvidia-smi --query-compute-apps=gpu_uuid,pid,process_name,used_memory --format=csv,noheader,nounits")
    rows = []
    for line in output.splitlines():
        parts = [part.strip() for part in line.split(",")]
        if len(parts) < 4:
            continue
        rows.append(
            {{
                "gpu_uuid": parts[0],
                "pid": parts[1],
                "process_name": parts[2],
                "used_memory_mb": parse_optional_float(parts[3], 0.0),
            }}
        )
    return rows

def top_processes():
    output = run("ps -eo user,pid,pcpu,pmem,etime,comm,args --no-headers --sort=-pcpu | head -n 8")
    rows = []
    for line in output.splitlines():
        parts = line.split(None, 6)
        if len(parts) < 7:
            continue
        rows.append(
            {{
                "user": parts[0],
                "pid": parts[1],
                "cpu_percent": parse_optional_float(parts[2], 0.0),
                "mem_percent": parse_optional_float(parts[3], 0.0),
                "elapsed": parts[4],
                "command": parts[5],
                "args": parts[6],
            }}
        )
    return rows

gpus = gpu_devices()
memory = meminfo()
disk = disk_info(root)
gpu_avg = round(sum(device.get("utilization_percent", 0.0) for device in gpus) / len(gpus), 1) if gpus else 0.0

payload = {{
    "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "host": run("hostname") or "unknown",
    "uptime": run("uptime -p") or run("uptime"),
    "cpu_usage_percent": cpu_usage_percent(),
    "cpu_model": cpu_model(),
    "logical_cores": os.cpu_count() or 0,
    "load_average": loadavg(),
    "memory_used_mb": memory.get("used_mb", 0.0),
    "memory_total_mb": memory.get("total_mb", 0.0),
    "memory_usage_percent": memory.get("usage_percent", 0.0),
    "disk_used_text": disk.get("used_text", ""),
    "disk_percent": disk.get("percent", 0.0),
    "gpu_count": len(gpus),
    "gpu_avg_usage_percent": gpu_avg,
    "gpu_payload": gpus,
    "gpu_processes": gpu_processes(),
    "top_processes": top_processes(),
}}

print(json.dumps(payload))
"""


def run_remote_probe(server: dict[str, Any]) -> dict[str, Any]:
    script = build_probe_script(server)
    result = subprocess.run(
        [
            "ssh",
            "-o",
            "BatchMode=yes",
            "-o",
            "ConnectTimeout=8",
            server["ssh_alias"],
            f"python3 - <<'PY'\n{script}\nPY",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        error_text = (result.stderr or result.stdout or "SSH request failed").strip()
        raise RuntimeError(error_text)
    return json.loads(result.stdout)


def build_target_row(server: dict[str, Any]) -> dict[str, Any]:
    return {
        "alias": server["alias"],
        "label": server["label"],
        "ssh_alias": server["ssh_alias"],
        "root_label": server["root_label"],
        "sort_order": server["sort_order"],
        "is_active": True,
    }


def build_snapshot_row(server: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    generated_at = str(payload.get("generated_at") or utc_now())
    return {
        "server_alias": server["alias"],
        "status": "live",
        "error_message": None,
        "generated_at": generated_at,
        "host": payload.get("host"),
        "uptime": payload.get("uptime"),
        "cpu_usage_percent": payload.get("cpu_usage_percent"),
        "cpu_model": payload.get("cpu_model"),
        "logical_cores": payload.get("logical_cores"),
        "load_average": payload.get("load_average"),
        "memory_used_mb": payload.get("memory_used_mb"),
        "memory_total_mb": payload.get("memory_total_mb"),
        "memory_usage_percent": payload.get("memory_usage_percent"),
        "disk_used_text": payload.get("disk_used_text"),
        "disk_percent": payload.get("disk_percent"),
        "gpu_count": payload.get("gpu_count"),
        "gpu_avg_usage_percent": payload.get("gpu_avg_usage_percent"),
        "gpu_payload": payload.get("gpu_payload") or [],
        "gpu_processes": payload.get("gpu_processes") or [],
        "top_processes": payload.get("top_processes") or [],
        "updated_at": utc_now(),
    }


def build_error_snapshot(server: dict[str, Any], message: str) -> dict[str, Any]:
    timestamp = utc_now()
    return {
        "server_alias": server["alias"],
        "status": "error",
        "error_message": message,
        "generated_at": timestamp,
        "host": None,
        "uptime": None,
        "cpu_usage_percent": None,
        "cpu_model": None,
        "logical_cores": None,
        "load_average": None,
        "memory_used_mb": None,
        "memory_total_mb": None,
        "memory_usage_percent": None,
        "disk_used_text": None,
        "disk_percent": None,
        "gpu_count": 0,
        "gpu_avg_usage_percent": 0,
        "gpu_payload": [],
        "gpu_processes": [],
        "top_processes": [],
        "updated_at": timestamp,
    }


def upsert_rows(base_url: str, api_key: str, auth_token: str, table: str, conflict_column: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    query = urlencode({"on_conflict": conflict_column})
    url = f"{base_url.rstrip('/')}/rest/v1/{table}?{query}"
    request = Request(
        url,
        data=json.dumps(rows).encode("utf-8"),
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        response.read()


def collect_payload(config_path: Path, alias_filter: str | None) -> dict[str, Any]:
    config = load_config(config_path)
    servers = active_servers(config, alias_filter)
    targets: list[dict[str, Any]] = []
    snapshots: list[dict[str, Any]] = []

    for server in servers:
        targets.append(build_target_row(server))
        try:
            payload = run_remote_probe(server)
            snapshots.append(build_snapshot_row(server, payload))
        except Exception as error:  # noqa: BLE001
            snapshots.append(build_error_snapshot(server, str(error).strip() or "Unknown probe failure"))

    return {
        "generated_at": utc_now(),
        "config_path": str(config_path),
        "targets": targets,
        "snapshots": snapshots,
    }


def build_public_target_row(target: dict[str, Any]) -> dict[str, Any]:
    return {
        "alias": target.get("alias"),
        "label": target.get("label"),
        "sort_order": target.get("sort_order"),
        "is_active": bool(target.get("is_active", True)),
    }


def build_public_gpu_payload(devices: list[dict[str, Any]]) -> list[dict[str, Any]]:
    public_devices: list[dict[str, Any]] = []
    for index, raw in enumerate(devices):
        if not isinstance(raw, dict):
            continue
        public_devices.append(
            {
                "index": raw.get("index", str(index)),
                "name": raw.get("name"),
                "temperature_c": raw.get("temperature_c"),
                "utilization_percent": raw.get("utilization_percent"),
                "memory_total_mb": raw.get("memory_total_mb"),
                "memory_used_mb": raw.get("memory_used_mb"),
                "memory_percent": raw.get("memory_percent"),
            }
        )
    return public_devices


def build_public_snapshot_row(snapshot: dict[str, Any]) -> dict[str, Any]:
    return {
        "server_alias": snapshot.get("server_alias"),
        "status": snapshot.get("status"),
        "error_message": snapshot.get("error_message"),
        "generated_at": snapshot.get("generated_at"),
        "uptime": snapshot.get("uptime"),
        "cpu_usage_percent": snapshot.get("cpu_usage_percent"),
        "cpu_model": snapshot.get("cpu_model"),
        "logical_cores": snapshot.get("logical_cores"),
        "load_average": snapshot.get("load_average"),
        "memory_used_mb": snapshot.get("memory_used_mb"),
        "memory_total_mb": snapshot.get("memory_total_mb"),
        "memory_usage_percent": snapshot.get("memory_usage_percent"),
        "disk_used_text": snapshot.get("disk_used_text"),
        "disk_percent": snapshot.get("disk_percent"),
        "gpu_count": snapshot.get("gpu_count"),
        "gpu_avg_usage_percent": snapshot.get("gpu_avg_usage_percent"),
        "gpu_payload": build_public_gpu_payload(snapshot.get("gpu_payload") or []),
    }


def build_public_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "generated_at": payload.get("generated_at"),
        "targets": [
            build_public_target_row(target)
            for target in payload.get("targets", [])
            if isinstance(target, dict)
        ],
        "snapshots": [
            build_public_snapshot_row(snapshot)
            for snapshot in payload.get("snapshots", [])
            if isinstance(snapshot, dict)
        ],
    }


def write_payload_file(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    public_payload = build_public_payload(payload)
    path.write_text(f"{json.dumps(public_payload, indent=2)}\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync private workspace server snapshots into Supabase.")
    parser.add_argument("--config", help="Optional path to workspace server config JSON.")
    parser.add_argument("--alias", help="Only collect one server alias.")
    parser.add_argument("--dry-run", action="store_true", help="Print the payload without writing to Supabase.")
    parser.add_argument(
        "--fallback-output",
        help="Optional path to write the collected payload as a repo-backed fallback JSON file.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config_path = resolve_config_path(args.config)
    payload = collect_payload(config_path, args.alias)
    fallback_output = Path(args.fallback_output).expanduser().resolve() if args.fallback_output else None

    if args.dry_run:
        if fallback_output:
            write_payload_file(fallback_output, payload)
        json.dump(payload, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    if fallback_output:
        write_payload_file(fallback_output, payload)

    supabase_url, api_key, auth_token, auth_mode = resolve_supabase_auth()
    if not supabase_url or not api_key or not auth_token:
        if fallback_output:
            print(
                f"Wrote fallback payload to {fallback_output} from {config_path}. "
                "Supabase auth is unavailable, so no table sync was attempted."
            )
            return 0
        raise SystemExit(
            "Supabase write auth is required unless --dry-run is used. "
            "Set WORKSPACE_SUPABASE_SERVICE_ROLE_KEY, or set WORKSPACE_SUPABASE_ACCESS_TOKEN "
            "with an anon key available in env or assets/workspace-config.js."
        )

    upsert_rows(supabase_url, api_key, auth_token, "workspace_server_targets", "alias", payload["targets"])
    upsert_rows(supabase_url, api_key, auth_token, "workspace_server_snapshots", "server_alias", payload["snapshots"])

    print(
        f"Synced {len(payload['targets'])} server target(s) and {len(payload['snapshots'])} snapshot(s) "
        f"from {config_path} using {auth_mode}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
