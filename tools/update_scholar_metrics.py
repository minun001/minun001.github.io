from __future__ import annotations

import html
import json
import os
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen


PROFILE_URL = "https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en&cstart=0&pagesize=100"
BASE_URL = "https://scholar.google.com"
METRICS_OUTPUT_PATH = Path("_data/google-scholar-metrics.json")
PUBLICATIONS_OUTPUT_PATH = Path("_data/google-scholar-publications.json")
OVERRIDES_PATH = Path("tools/scholar_publication_overrides.json")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)
KST = timezone(timedelta(hours=9))
SECTION_LABELS = {
    "international-journals": "International Journals",
    "domestic-journals": "Domestic Journals",
    "international-conferences": "International Conferences",
    "domestic-conferences": "Domestic Conferences",
}
DOMESTIC_VENUE_PATTERNS = (
    "journal of korean",
    "korean society",
    "korea institute",
    "korea communications society",
    "the journal of the korea institute",
    "대한",
    "한국",
    "학회",
)
CONFERENCE_HINTS = (
    "conference",
    "congress",
    "symposium",
    "workshop",
    "학술발표회",
    "학술대회",
    "학술발표논문집",
)


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def clean_html_text(value: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", value, flags=re.IGNORECASE)
    text = re.sub(r"<.*?>", " ", text, flags=re.DOTALL)
    text = html.unescape(text)
    return " ".join(text.split()).strip()


def load_overrides() -> dict[str, Any]:
    return json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))


def load_json_if_exists(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def parse_metrics(profile_html: str) -> dict[str, dict[str, int]]:
    metric_map: dict[str, dict[str, int]] = {}
    pattern = re.compile(
        r">(?P<label>Citations|h-index|i10-index)</a></td>"
        r"<td class=\"gsc_rsb_std\">(?P<all>\d+)</td>"
        r"<td class=\"gsc_rsb_std\">(?P<recent>\d+)</td>"
    )

    for match in pattern.finditer(profile_html):
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


def parse_profile_rows(profile_html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row_html in re.findall(r"<tr class=\"gsc_a_tr\">(.*?)</tr>", profile_html, flags=re.DOTALL):
        title_match = re.search(
            r'href=\"([^\"]*citation_for_view=[^\"]+)\" class=\"gsc_a_at\">(.*?)</a>',
            row_html,
            flags=re.DOTALL,
        )
        if not title_match:
            continue

        raw_href = html.unescape(title_match.group(1))
        full_href = urljoin(BASE_URL, raw_href)
        query = parse_qs(urlparse(full_href).query)
        citation_for_view = query.get("citation_for_view", [""])[0]
        citation_id = citation_for_view.split(":")[-1] if ":" in citation_for_view else citation_for_view
        meta_values = [
            clean_html_text(value)
            for value in re.findall(r'<div class=\"gs_gray\">(.*?)</div>', row_html, flags=re.DOTALL)
        ]
        citation_count_match = re.search(r'class=\"gsc_a_ac[^"]*\">(\d+)</a>', row_html)
        year_match = re.search(r'class=\"gsc_a_y\".*?>(\d{4})<', row_html, flags=re.DOTALL)

        rows.append(
            {
                "citation_id": citation_id,
                "scholar_url": full_href,
                "title": clean_html_text(title_match.group(2)),
                "authors_row": meta_values[0] if len(meta_values) > 0 else "",
                "venue_row": meta_values[1] if len(meta_values) > 1 else "",
                "citation_count": int(citation_count_match.group(1)) if citation_count_match else 0,
                "year": int(year_match.group(1)) if year_match else None,
            }
        )
    return rows


def parse_detail_page(detail_html: str) -> dict[str, str]:
    title_match = re.search(r'id=\"gsc_oci_title\">(.*?)</div>', detail_html, flags=re.DOTALL)
    detail_map: dict[str, str] = {"title": clean_html_text(title_match.group(1)) if title_match else ""}

    field_pattern = re.compile(
        r'<div class=\"gs_scl\">\s*<div class=\"gsc_oci_field\">(.*?)</div>\s*'
        r'<div class=\"gsc_oci_value\"(?: id=\"[^\"]+\")?>(.*?)</div>\s*</div>',
        flags=re.DOTALL,
    )
    for raw_field, raw_value in field_pattern.findall(detail_html):
        field = clean_html_text(raw_field)
        value = clean_html_text(raw_value)
        if field:
            detail_map[field] = value

    return detail_map


def infer_publication_kind(venue: str, detail_map: dict[str, str]) -> str:
    venue_lower = venue.lower()
    if detail_map.get("Conference"):
        return "conference"
    if any(hint in venue_lower for hint in CONFERENCE_HINTS):
        return "conference"
    if detail_map.get("Journal"):
        return "journal"
    return "conference" if "proceedings" in venue_lower else "journal"


def infer_scope(venue: str) -> str:
    venue_lower = venue.lower()
    if any(ord(char) > 127 and "\uac00" <= char <= "\ud7a3" for char in venue):
        return "domestic"
    if any(pattern in venue_lower for pattern in DOMESTIC_VENUE_PATTERNS):
        return "domestic"
    return "international"


def classify_record(venue: str, detail_map: dict[str, str], override: dict[str, Any] | None) -> str:
    if override and override.get("category"):
        return str(override["category"])
    kind = infer_publication_kind(venue, detail_map)
    scope = infer_scope(venue)
    return f"{scope}-{kind}s"


def extract_year(detail_map: dict[str, str], row: dict[str, Any]) -> int | None:
    publication_date = detail_map.get("Publication date", "")
    match = re.search(r"(\d{4})", publication_date)
    if match:
        return int(match.group(1))
    return row.get("year")


def build_details(detail_map: dict[str, str], row: dict[str, Any], category: str) -> str:
    year = extract_year(detail_map, row)
    publication_date = detail_map.get("Publication date", "")
    volume = detail_map.get("Volume", "")
    issue = detail_map.get("Issue", "")
    pages = detail_map.get("Pages", "")

    if "journals" in category:
        parts: list[str] = []
        if volume:
            parts.append(f"Volume {volume}")
        if issue:
            parts.append(f"Issue {issue}")
        if pages:
            page_label = "Article" if pages.isdigit() else "Pages"
            parts.append(f"{page_label} {pages}")
        if year:
            parts.append(str(year))
        if parts:
            return " | ".join(parts)
        if publication_date:
            return publication_date

    if publication_date and year and publication_date != str(year):
        return publication_date.replace("/", "-")
    return str(year) if year else ""


def summarize_description(detail_map: dict[str, str], title: str) -> str:
    description = detail_map.get("Description", "")
    if not description:
        return f"This record is synchronized from Google Scholar for {title}."

    sentences = re.split(r"(?<=[.!?])\s+", description)
    summary = " ".join(sentences[:2]).strip()
    if len(summary) > 320:
        summary = summary[:317].rsplit(" ", 1)[0].rstrip(" ,;:") + "..."
    return summary or f"This record is synchronized from Google Scholar for {title}."


def infer_topic(title: str, venue: str, summary: str) -> tuple[str, str]:
    text = f"{title} {venue} {summary}".lower()
    topic_map = [
        (
            ("autonomous", "trajectory", "vehicle", "driving", "maneuver"),
            ("Autonomous Driving", "Prediction and control for safer vehicle interaction."),
        ),
        (
            ("solar", "photovoltaic", "energy", "forecasting", "power"),
            ("Energy Forecasting", "Forecasting and management for photovoltaic energy systems."),
        ),
        (
            ("legal", "judgment", "sentencing", "traffic accident", "criminal", "road traffic"),
            ("Legal AI", "Decision support and prediction for traffic-accident legal cases."),
        ),
        (
            ("noise", "urban", "sound"),
            ("Urban Sensing", "Recognition and classification for urban traffic environments."),
        ),
        (
            ("tooth", "radiograph", "mask r-cnn", "panoramic"),
            ("Medical Imaging", "Computer vision for dental-image analysis."),
        ),
        (
            ("service", "operations", "behavioural", "behavioral", "routines"),
            ("Operations Research", "Research on service routines and operations behavior."),
        ),
    ]

    for keywords, topic in topic_map:
        if any(keyword in text for keyword in keywords):
            return topic
    return ("Research Paper", "Synchronized automatically from the Google Scholar profile.")


def build_bibtex_key(title: str, authors: str, year: int | None) -> str:
    surname = "min"
    if authors:
        first_author = authors.split(",")[0].strip().split()[-1].lower()
        if re.search(r"[a-z]", first_author):
            surname = re.sub(r"[^a-z0-9]", "", first_author) or "min"
    title_word = re.sub(r"[^a-z0-9]", "", clean_html_text(title).lower().split(" ")[0]) or "paper"
    year_part = str(year) if year else "noyear"
    return f"{surname}{year_part}{title_word}"


def build_bibtex(record: dict[str, Any]) -> str:
    year = record.get("year")
    entry_type = "article" if "journals" in record["category"] else "inproceedings"
    venue_field = "journal" if entry_type == "article" else "booktitle"
    lines = [
        f"@{entry_type}{{{build_bibtex_key(record['title'], record.get('authors', ''), year)},",
        f"  title={{{record['title']}}},",
        f"  author={{{record.get('authors', '')}}},",
        f"  {venue_field}={{{record.get('venue', '')}}},",
    ]
    if record.get("volume"):
        lines.append(f"  volume={{{record['volume']}}},")
    if record.get("issue"):
        lines.append(f"  number={{{record['issue']}}},")
    if record.get("pages"):
        lines.append(f"  pages={{{record['pages']}}},")
    if record.get("doi"):
        lines.append(f"  doi={{{record['doi']}}},")
    if year:
        lines.append(f"  year={{{year}}}")
    else:
        lines[-1] = lines[-1].rstrip(",")
    lines.append("}")
    return "\n".join(lines)


def build_search_terms(record: dict[str, Any]) -> str:
    values = [
        record.get("title", ""),
        record.get("venue", ""),
        record.get("authors", ""),
        record.get("summary", ""),
        SECTION_LABELS.get(record["category"], ""),
        " ".join(record.get("keywords", [])),
    ]
    return " ".join(value for value in values if value).strip()


def normalize_dedupe_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    normalized = re.sub(r"[^0-9a-zA-Z가-힣]+", " ", normalized.lower())
    return " ".join(normalized.split())


def record_dedupe_key(record: dict[str, Any]) -> tuple[str, str, str]:
    return (
        record.get("category", ""),
        normalize_dedupe_text(record.get("title", "")),
        normalize_dedupe_text(record.get("venue", "")),
    )


def prefer_record(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    left_score = (
        (1 if left.get("source") == "manual" else 0),
        (1 if left.get("image") else 0),
        left.get("citation_count", 0),
    )
    right_score = (
        (1 if right.get("source") == "manual" else 0),
        (1 if right.get("image") else 0),
        right.get("citation_count", 0),
    )
    return left if left_score >= right_score else right


def dedupe_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    by_signature: dict[tuple[str, str, str], dict[str, Any]] = {}

    for record in records:
        record_id = record.get("id", "")
        if record_id in by_id:
            by_id[record_id] = prefer_record(by_id[record_id], record)
            continue

        signature = record_dedupe_key(record)
        if signature in by_signature:
            chosen = prefer_record(by_signature[signature], record)
            if chosen is not by_signature[signature]:
                old_id = by_signature[signature].get("id", "")
                if old_id:
                    by_id.pop(old_id, None)
            by_signature[signature] = chosen
            by_id[chosen.get("id", "")] = chosen
            continue

        by_id[record_id] = record
        by_signature[signature] = record

    return list(by_id.values())


def build_scholar_record(
    row: dict[str, Any],
    detail_map: dict[str, str],
    override: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if override and override.get("hidden"):
        return None

    venue = (
        detail_map.get("Journal")
        or detail_map.get("Conference")
        or detail_map.get("Source")
        or override.get("display_venue")
        if override
        else None
    )
    venue = venue or row.get("venue_row", "")
    category = classify_record(venue, detail_map, override)
    title = (override.get("display_title") if override else None) or detail_map.get("title") or row["title"]
    authors = (override.get("authors") if override else None) or detail_map.get("Authors") or row.get("authors_row", "")
    year = extract_year(detail_map, row)
    details = (override.get("details") if override else None) or build_details(detail_map, row, category)
    summary = (override.get("summary") if override else None) or summarize_description(detail_map, title)
    topic_title, topic_copy = infer_topic(title, venue, summary)

    record: dict[str, Any] = {
        "id": row["citation_id"],
        "source": "scholar",
        "scholar_url": row["scholar_url"],
        "title": title,
        "venue": (override.get("display_venue") if override else None) or venue,
        "authors": authors,
        "details": details,
        "summary": summary,
        "category": category,
        "topic_title": (override.get("topic_title") if override else None) or topic_title,
        "topic_copy": (override.get("topic_copy") if override else None) or topic_copy,
        "year": year,
        "citation_count": row.get("citation_count", 0),
        "keywords": list(override.get("keywords", [])) if override else [],
        "doi": (override.get("doi") if override else None) or detail_map.get("DOI", ""),
        "image": (override.get("image") if override else None) or "",
        "image_alt": (override.get("image_alt") if override else None) or "",
        "volume": detail_map.get("Volume", ""),
        "issue": detail_map.get("Issue", ""),
        "pages": detail_map.get("Pages", ""),
        "journal_metrics": dict(override.get("journal_metrics", {})) if override else {},
    }
    record["search_terms"] = build_search_terms(record)
    if "journals" in category:
        record["bibtex"] = build_bibtex(record)
    return record


def build_manual_record(manual_record: dict[str, Any]) -> dict[str, Any]:
    record = {
        "id": manual_record["id"],
        "source": "manual",
        "scholar_url": manual_record.get("scholar_url", ""),
        "title": manual_record["display_title"],
        "venue": manual_record["display_venue"],
        "authors": manual_record.get("authors", ""),
        "details": manual_record.get("details", ""),
        "summary": manual_record.get("summary", ""),
        "category": manual_record["category"],
        "topic_title": manual_record.get("topic_title", "Research Paper"),
        "topic_copy": manual_record.get("topic_copy", "Tracked manually for the publication archive."),
        "year": manual_record.get("year"),
        "citation_count": manual_record.get("citation_count", 0),
        "keywords": manual_record.get("keywords", []),
        "doi": manual_record.get("doi", ""),
        "image": manual_record.get("image", ""),
        "image_alt": manual_record.get("image_alt", ""),
        "volume": manual_record.get("volume", ""),
        "issue": manual_record.get("issue", ""),
        "pages": manual_record.get("pages", ""),
        "journal_metrics": dict(manual_record.get("journal_metrics", {})),
    }
    if manual_record.get("bibtex"):
        record["bibtex"] = manual_record["bibtex"]
    record["search_terms"] = build_search_terms(record)
    return record


def sort_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        records,
        key=lambda record: (
            -(record.get("year") or 0),
            -record.get("citation_count", 0),
            record.get("title", "").lower(),
        ),
    )


def build_metrics_payload(metrics: dict[str, dict[str, int]], profile_name: str) -> dict[str, Any]:
    now = datetime.now(KST)
    display_date = f"{now.strftime('%B')} {now.day}, {now.year}"
    return {
        "profile_name": profile_name,
        "source_url": PROFILE_URL.replace("&cstart=0&pagesize=100", ""),
        "citations": metrics["citations"],
        "h_index": metrics["h_index"],
        "i10_index": metrics["i10_index"],
        "checked_at": now.strftime("%Y-%m-%d"),
        "checked_at_display": display_date,
    }


def build_publications_payload(
    overrides: dict[str, Any],
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    now = datetime.now(KST)
    display_date = f"{now.strftime('%B')} {now.day}, {now.year}"
    sections: list[dict[str, Any]] = []
    for key in overrides["section_order"]:
        section_records = [record for record in records if record["category"] == key]
        sections.append(
            {
                "key": key,
                "label": SECTION_LABELS[key],
                "count": len(section_records),
                "description": overrides["section_descriptions"][key],
                "items": sort_records(section_records),
            }
        )

    return {
        "profile_name": overrides["profile_name"],
        "source_url": overrides["source_url"],
        "checked_at": now.strftime("%Y-%m-%d"),
        "checked_at_display": display_date,
        "total_records": len(records),
        "sections": sections,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def payload_without_refresh_stamp(payload: dict[str, Any]) -> dict[str, Any]:
    stripped = json.loads(json.dumps(payload))
    stripped.pop("checked_at", None)
    stripped.pop("checked_at_display", None)
    return stripped


def write_publications_payload_if_changed(payload: dict[str, Any]) -> bool:
    current_payload = load_json_if_exists(PUBLICATIONS_OUTPUT_PATH)
    if current_payload and payload_without_refresh_stamp(current_payload) == payload_without_refresh_stamp(payload):
        return False
    write_json(PUBLICATIONS_OUTPUT_PATH, payload)
    return True


def main() -> None:
    overrides = load_overrides()
    try:
        profile_html = fetch_html(PROFILE_URL)
        metrics = parse_metrics(profile_html)
        rows = parse_profile_rows(profile_html)

        override_map: dict[str, dict[str, Any]] = overrides.get("scholar_overrides", {})
        records: list[dict[str, Any]] = []
        for row in rows:
            detail_html = fetch_html(row["scholar_url"])
            detail_map = parse_detail_page(detail_html)
            record = build_scholar_record(row, detail_map, override_map.get(row["citation_id"]))
            if record:
                records.append(record)

        for manual_record in overrides.get("manual_records", []):
            records.append(build_manual_record(manual_record))

        records = dedupe_records(records)

        metrics_payload = build_metrics_payload(metrics, overrides["profile_name"])
        publications_payload = build_publications_payload(overrides, records)
        write_json(METRICS_OUTPUT_PATH, metrics_payload)
        publications_changed = write_publications_payload_if_changed(publications_payload)
        print(
            "Updated Google Scholar data with "
            f"citations={metrics_payload['citations']['all']} "
            f"and {publications_payload['total_records']} publication records "
            f"({'changed' if publications_changed else 'no publication changes'})."
        )
    except (HTTPError, URLError, RuntimeError) as error:
        if os.environ.get("GITHUB_ACTIONS") == "true":
            raise RuntimeError(f"Google Scholar refresh failed in GitHub Actions: {error}") from error
        raise


if __name__ == "__main__":
    main()
