"""MIAE — Market Intelligence & Allocation Engine (daily, lightweight)."""

from __future__ import annotations

from typing import Any

from aethra.config import AethraConfig
from aethra.util_json import content_hash


def run_miae(
    cfg: AethraConfig,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Returns top N opportunities. Without external `trend_summaries` in context,
    opportunities list is empty — no fabricated market data.
    """
    ctx = context or {}
    raw_summaries = ctx.get("trend_summaries")
    opportunities: list[dict[str, Any]] = []

    if isinstance(raw_summaries, list):
        for item in raw_summaries[: cfg.max_opportunities_returned]:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title", "")).strip()
            if not title:
                continue
            opportunities.append(
                {
                    "title": title,
                    "gap_hypothesis": str(item.get("gap_hypothesis", "")).strip(),
                    "score": float(item.get("score", 0.0)),
                    "source_ref": str(item.get("source_ref", "")).strip(),
                    "record_hash": content_hash(item)[:12],
                }
            )
        opportunities.sort(key=lambda x: (-x["score"], x["title"]))

    allocation_hint = None
    if opportunities:
        top = opportunities[0]
        allocation_hint = (
            f"Validate `{top.get('title', '')[:80]}` first in IDEA mode; "
            f"allocate research time proportional to score {top.get('score', 0)}."
        )

    return {
        "opportunities": opportunities[: cfg.max_opportunities_returned],
        "requires_external_feed": not bool(opportunities),
        "allocation_hint": allocation_hint,
        "note": "Attach trend_summaries in context to populate opportunities; never invent metrics.",
    }
