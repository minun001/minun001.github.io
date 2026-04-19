from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen


PROFILE_URL = "https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en"
OUTPUT_PATH = Path("assets/data/google-scholar-metrics.json")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)
KST = timezone(timedelta(hours=9))


def fetch_profile_html() -> str:
    request = Request(
        PROFILE_URL,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def parse_metrics(html: str) -> dict[str, dict[str, int]]:
    metric_map: dict[str, dict[str, int]] = {}
    pattern = re.compile(
        r">(?P<label>Citations|h-index|i10-index)</a></td>"
        r"<td class=\"gsc_rsb_std\">(?P<all>\d+)</td>"
        r"<td class=\"gsc_rsb_std\">(?P<recent>\d+)</td>"
    )

    for match in pattern.finditer(html):
        label = match.group("label")
        key = label.lower().replace("-", "_")
        metric_map[key] = {
            "all": int(match.group("all")),
            "since_2021": int(match.group("recent")),
        }

    expected = {"citations", "h_index", "i10_index"}
    missing = expected.difference(metric_map)
    if missing:
        raise RuntimeError(f"Failed to parse metrics from Google Scholar: missing {sorted(missing)}")

    return metric_map


def build_payload(metrics: dict[str, dict[str, int]]) -> dict[str, object]:
    now = datetime.now(KST)
    display_date = f"{now.strftime('%B')} {now.day}, {now.year}"
    return {
        "profile_name": "Hyunsik Min",
        "source_url": PROFILE_URL,
        "citations": metrics["citations"],
        "h_index": metrics["h_index"],
        "i10_index": metrics["i10_index"],
        "checked_at": now.strftime("%Y-%m-%d"),
        "checked_at_display": display_date,
    }


def main() -> None:
    html = fetch_profile_html()
    metrics = parse_metrics(html)
    payload = build_payload(metrics)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {OUTPUT_PATH} with citations={payload['citations']['all']} and h-index={payload['h_index']['all']}.")


if __name__ == "__main__":
    main()
