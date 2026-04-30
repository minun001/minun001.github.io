from __future__ import annotations

import argparse
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage"
DEFAULT_TARGET_USER = "U0ALWBGLSBH"


def load_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def post_message(token: str, channel: str, message: str) -> dict:
    payload = json.dumps(
        {
            "channel": channel,
            "text": message,
            "unfurl_links": False,
            "unfurl_media": False,
        }
    ).encode("utf-8")
    request = Request(
        SLACK_POST_MESSAGE_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def build_message(raw_message: str) -> str:
    message = raw_message.strip()
    if not message:
        raise RuntimeError("Message is empty.")
    if message.startswith("[VLA]"):
        return message
    return f"[VLA] {message}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a VLA Slack DM.")
    parser.add_argument("message", help="Message body to send.")
    parser.add_argument(
        "--channel",
        default=os.getenv("SLACK_VLA_TARGET_USER", DEFAULT_TARGET_USER),
        help="Slack user ID to DM. Defaults to SLACK_VLA_TARGET_USER or Hyunsik Min.",
    )
    args = parser.parse_args()

    try:
        token = load_required_env("SLACK_VLA_BOT_TOKEN")
        message = build_message(args.message)
        result = post_message(token, args.channel, message)
    except (RuntimeError, HTTPError, URLError) as exc:
        print(f"VLA Slack DM failed: {exc}", file=sys.stderr)
        return 1

    if not result.get("ok"):
        print(f"VLA Slack DM failed: {result}", file=sys.stderr)
        return 1

    print(f"Sent VLA DM to {args.channel} at ts={result.get('ts')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
