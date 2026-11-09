"""Parse public Scholar profile rows without treating unreadable counts as zero."""

import re
from html.parser import HTMLParser
from typing import Any
from urllib.parse import parse_qs, urljoin, urlparse


class ProfileParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.stack: list[str] = []
        self.row: dict[str, Any] | None = None
        self.captures: list[dict[str, Any]] = []
        self.rows: list[dict[str, Any]] = []
        self.has_more = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        classes = (attributes.get("class") or "").split()
        if attributes.get("id") == "gsc_bpf_more":
            self.has_more = "disabled" not in attributes
        if tag in {"br", "img", "input", "meta", "link", "hr", "wbr"}:
            return
        self.stack.append(tag)
        if tag == "tr" and "gsc_a_tr" in classes:
            if self.row is not None:
                raise RuntimeError("Google Scholar returned an incomplete publication row")
            self.row = {"metadata": [], "count_seen": False}
        if self.row is None:
            return
        field = None
        if tag == "a" and "gsc_a_at" in classes:
            field = "title"
            self.row["href"] = attributes.get("href")
        elif tag == "a" and "gsc_a_ac" in classes:
            field = "count"
            self.row["count_seen"] = True
        elif tag == "div" and "gs_gray" in classes:
            field = "metadata"
        elif tag == "td" and "gsc_a_y" in classes:
            field = "year"
        if field:
            self.captures.append({"field": field, "tag": tag, "depth": len(self.stack), "text": []})

    def handle_data(self, data: str) -> None:
        for capture in self.captures:
            capture["text"].append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag not in self.stack:
            return
        depth = len(self.stack) - self.stack[::-1].index(tag)
        for capture in self.captures[:]:
            if capture["depth"] >= depth:
                value = " ".join("".join(capture["text"]).split())
                if self.row is not None:
                    if capture["field"] == "metadata":
                        self.row["metadata"].append(value)
                    else:
                        self.row[capture["field"]] = value
                self.captures.remove(capture)
        if tag == "tr" and self.row is not None:
            self.finish_row()
            self.row = None
        del self.stack[depth - 1:]

    def finish_row(self) -> None:
        row = self.row
        if not row or not row.get("title") or not row.get("href") or not row["count_seen"]:
            raise RuntimeError("Google Scholar publication title or citation count is missing; snapshots retained")
        url = urljoin("https://scholar.google.com", row["href"])
        parsed = urlparse(url)
        citation = parse_qs(parsed.query).get("citation_for_view", [""])[0]
        if parsed.scheme != "https" or parsed.netloc != "scholar.google.com" or not citation:
            raise RuntimeError("Google Scholar returned an invalid publication link")
        count = row.get("count", "").replace(",", "")
        # Scholar uses an explicitly empty citation anchor for a verified zero.
        if count and not re.fullmatch(r"[0-9]+", count):
            raise RuntimeError("Google Scholar citation count is unreadable; snapshots retained")
        year = re.search(r"\b([0-9]{4})\b", row.get("year", ""))
        metadata = row["metadata"]
        self.rows.append({
            "citation_id": citation.split(":")[-1],
            "scholar_url": url,
            "title": row["title"],
            "authors_row": metadata[0] if metadata else "",
            "venue_row": metadata[1] if len(metadata) > 1 else "",
            "citation_count": int(count) if count else 0,
            "year": int(year.group(1)) if year else None,
        })


def parse_profile_rows(profile_html: str) -> list[dict[str, Any]]:
    parser = ProfileParser()
    parser.feed(profile_html)
    parser.close()
    if parser.row is not None:
        raise RuntimeError("Google Scholar returned a truncated publication list; snapshots retained")
    if parser.has_more:
        raise RuntimeError("Google Scholar profile exceeds the requested page; refusing a partial citation snapshot")
    ids = [row["citation_id"] for row in parser.rows]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Google Scholar returned duplicate publication IDs")
    return parser.rows
