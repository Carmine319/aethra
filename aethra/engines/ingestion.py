"""Ingestion Engine — fetch URL, trim HTML."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from aethra.config import AethraConfig


def _trim_text(soup: BeautifulSoup, max_chars: int) -> str:
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    text = re.sub(r"[ \t\r\f]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text[:max_chars]


def run_ingestion(url: str, cfg: AethraConfig, timeout_s: float = 20.0) -> dict[str, Any]:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return {
            "url": url,
            "ok": False,
            "error": "invalid_url",
            "trimmed_text": "",
            "char_count": 0,
            "headlines_sample": [],
        }

    try:
        with httpx.Client(follow_redirects=True, timeout=timeout_s) as client:
            r = client.get(url, headers={"User-Agent": "AETHRA-Ingestion/1.0 (research; +https://example.local)"})
            r.raise_for_status()
            html = r.text
    except Exception as e:
        return {
            "url": url,
            "ok": False,
            "error": type(e).__name__,
            "trimmed_text": "",
            "char_count": 0,
            "headlines_sample": [],
        }

    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ""
    headlines_sample: list[str] = []
    for tag in soup.find_all(["h1", "h2"])[:14]:
        t = tag.get_text(separator=" ", strip=True)
        if t and len(t) > 2:
            headlines_sample.append(t[:240])
    trimmed = _trim_text(soup, cfg.ingest_max_chars)
    meta_desc = ""
    md = soup.find("meta", attrs={"name": "description"})
    if md and md.get("content"):
        meta_desc = str(md["content"]).strip()[:500]

    return {
        "url": url,
        "ok": True,
        "http_status": r.status_code,
        "title": title,
        "meta_description": meta_desc,
        "trimmed_text": trimmed,
        "char_count": len(trimmed),
        "within_target_range": cfg.ingest_min_chars_target <= len(trimmed) <= cfg.ingest_max_chars,
        "headlines_sample": headlines_sample,
    }
