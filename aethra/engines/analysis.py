"""Analysis Engine — monetisation gaps, conversion, messaging (deterministic heuristics)."""

from __future__ import annotations

import re
from typing import Any


_CTA = re.compile(r"\b(buy\s+now|subscribe|book\s+a\s+demo|get\s+started|checkout|pricing)\b", re.I)
_PRICE = re.compile(r"(\$|€|£|\bgbp\b|\beur\b|\busd\b|\d{1,3}[.,]\d{2}\s*(?:/mo|/month|pm))\b", re.I)
_SOCIAL = re.compile(r"\b(trust|testimonial|review|case\s+study|logo\s+wall)\b", re.I)


def run_analysis(ingestion: dict[str, Any]) -> dict[str, Any]:
    text = f"{ingestion.get('title','')} {ingestion.get('meta_description','')} {ingestion.get('trimmed_text','')}"
    gaps: list[str] = []
    conversion: list[str] = []
    messaging: list[str] = []

    if not _CTA.search(text):
        conversion.append("weak_or_missing_primary_cta_in_visible_copy")
    if not _PRICE.search(text):
        gaps.append("pricing_signal_not_obvious_in_trimmed_copy")
    if not _SOCIAL.search(text):
        conversion.append("limited_trust_proof_signals_in_trimmed_copy")

    if len(text.split()) < 80:
        messaging.append("thin_copy_may_underexplain_value_proposition")

    low = text.lower()
    if "free" in low and "trial" not in low and "plan" not in low:
        messaging.append("free_claim_without_structured_trial_or_plan_context")

    all_issues = list(gaps) + list(conversion) + list(messaging)
    priority_fixes: list[str] = []
    if gaps:
        priority_fixes.append(gaps[0])
    if conversion:
        priority_fixes.append(conversion[0])
    if messaging:
        priority_fixes.append(messaging[0])
    for x in sorted(set(all_issues)):
        if x not in priority_fixes:
            priority_fixes.append(x)

    return {
        "monetisation_gaps": sorted(set(gaps)),
        "conversion_issues": sorted(set(conversion)),
        "messaging_weaknesses": sorted(set(messaging)),
        "priority_fixes_ordered": priority_fixes,
        "issue_count": len(set(all_issues)),
        "evidence": "heuristic_scan_of_trimmed_page_text_only",
    }
