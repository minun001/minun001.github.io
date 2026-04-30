from __future__ import annotations

import argparse
import json
from pathlib import Path


STATE_PATH = Path(__file__).with_name("vla_session_bridge_state.json")


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"sessions": {}}
    return json.loads(STATE_PATH.read_text(encoding="utf-8"))


def save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ensure_session(state: dict, session_id: str) -> dict:
    sessions = state.setdefault("sessions", {})
    return sessions.setdefault(session_id, {})


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage VLA session bridge state.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    show_parser = subparsers.add_parser("show")
    show_parser.add_argument("--session", required=True)

    set_ts_parser = subparsers.add_parser("set-last-ts")
    set_ts_parser.add_argument("--session", required=True)
    set_ts_parser.add_argument("--ts", required=True)
    set_ts_parser.add_argument("--updated-kst", required=False)

    args = parser.parse_args()
    state = load_state()
    session = ensure_session(state, args.session)

    if args.command == "show":
      print(json.dumps(session, ensure_ascii=False, indent=2))
      return 0

    if args.command == "set-last-ts":
      session["last_processed_user_message_ts"] = args.ts
      if args.updated_kst:
          session["last_bridge_update_kst"] = args.updated_kst
      save_state(state)
      print(json.dumps(session, ensure_ascii=False, indent=2))
      return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
