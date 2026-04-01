"""Deterministic idea slot extraction and feature signals (no LLM)."""

from __future__ import annotations

import re
from typing import Any


_PROBLEM_HINTS = re.compile(
    r"\b(pain|problem|struggle|waste|slow|error|manual|expensive|risk|friction|"
    r"inefficient|bottleneck|churn|leak|downtime|complian|audit|fraud|"
    r"strain|injury|fatigue|discomfort|posture|rsi|carpal|ergonomic|ache)\b",
    re.I,
)
_OUTCOME_HINTS = re.compile(
    r"\b(save|reduce|cut|faster|automate|scale|grow|retain|convert|revenue|margin|roi)\b",
    re.I,
)
_MOAT_HINTS = re.compile(
    r"\b(proprietary|patent|exclusive|integration|api|workflow|data\s+network|"
    r"switching\s+cost|certified|regulated|niche|vertical)\b",
    re.I,
)
_LEGAL_HIGH = re.compile(
    r"\b(pharma|prescription|clinical|diagnos|treat\s+cancer|financial\s+advice|"
    r"investment\s+advice|crypto|gambling|loan|credit\s+repair|medical\s+device)\b",
    re.I,
)
_GEO = re.compile(
    r"\b(uk|united\s+kingdom|britain|england|scotland|wales|northern\s+ireland|"
    r"eu|europe|european|germany|france|netherlands|ireland|us\b|usa|united\s+states|apac|emea)\b",
    re.I,
)
_B2B = re.compile(
    r"\b(b2b|enterprise|smb|teams|department|procurement|vendor|saas|workflow|ops)\b",
    re.I,
)
_B2C = re.compile(r"\b(b2c|consumer|shopper|creator|parent|patient|home\s+user)\b", re.I)
_CHANNEL = re.compile(
    r"\b(seo|paid\s+ads|linkedin|tiktok|instagram|email|community|partner|referral|"
    r"marketplace|retail|wholesale)\b",
    re.I,
)
_COMPETITOR = re.compile(
    r"\b(vs\.?|versus|compared\s+to|unlike|alternative\s+to|better\s+than)\b",
    re.I,
)
_PRICE = re.compile(
    r"\b(premium|low[- ]cost|budget|subscription|freemium|enterprise\s+pricing)\b",
    re.I,
)
_VERTICALS: list[tuple[str, re.Pattern[str]]] = [
    ("dev_engineering", re.compile(r"\b(dev|developer|engineer|code|api|git|deploy)\b", re.I)),
    ("hr_people", re.compile(r"\b(hr|hiring|payroll|people|talent|recruit)\b", re.I)),
    ("finance_ops", re.compile(r"\b(finance|accounting|invoice|ledger|tax|fp&a)\b", re.I)),
    ("commerce", re.compile(r"\b(ecommerce|shopify|retail|sku|inventory|fulfilment)\b", re.I)),
    ("health_wellness", re.compile(r"\b(health|wellness|clinic|therapy|fitness)\b", re.I)),
    ("legal_governance", re.compile(r"\b(legal|contract|governance|policy|gdpr)\b", re.I)),
]


def _norm_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def extract_idea_slots(text: str) -> dict[str, Any]:
    raw = _norm_text(text)
    low = raw.lower()
    if low.startswith("validate idea:"):
        raw = _norm_text(raw.split(":", 1)[1])
        low = raw.lower()

    product = raw[:280] if raw else ""

    user = ""
    for pattern in (
        r"\bfor\s+([a-z0-9,\s\-]{3,100})",
        r"\b(target(?:ing)?\s+)?([a-z0-9,\s\-]{3,100})\s+(?:users|customers|buyers|teams)\b",
        r"\b(icp|audience)\s*[:\-]\s*([a-z0-9,\s\-]{3,100})\b",
    ):
        m = re.search(pattern, low)
        if m:
            user = _norm_text(m.group(m.lastindex or 1))
            break

    problem_statement = ""
    if _PROBLEM_HINTS.search(raw):
        problem_statement = "explicit_pain_or_risk_language"
    elif _OUTCOME_HINTS.search(raw):
        problem_statement = "outcome_or_metric_language"
    elif len(raw.split()) >= 12:
        problem_statement = "implicit_from_rich_description"
    else:
        problem_statement = "thin_or_unspecified"

    geo_hints = sorted(set(m.group(0).lower().replace(" ", "_") for m in _GEO.finditer(raw)))[:8]
    channel_hints = sorted(set(m.group(0).lower().replace(" ", "_") for m in _CHANNEL.finditer(raw)))[:8]

    b2b_b2c = "unknown"
    if _B2B.search(raw) and not _B2C.search(raw):
        b2b_b2c = "b2b"
    elif _B2C.search(raw) and not _B2B.search(raw):
        b2b_b2c = "b2c"
    elif _B2B.search(raw) and _B2C.search(raw):
        b2b_b2c = "mixed"

    verticals = [name for name, pat in _VERTICALS if pat.search(raw)]

    tokens = [w.lower() for w in re.findall(r"[a-zA-Z][a-zA-Z\-]{2,}", raw)]
    unique_ratio = round(len(set(tokens)) / max(len(tokens), 1), 4)

    return {
        "product_hypothesis": product,
        "user_segment_hint": user or "unspecified",
        "problem_class": problem_statement,
        "raw_idea": raw,
        "geo_hints": geo_hints,
        "channel_hints": channel_hints,
        "b2b_b2c": b2b_b2c,
        "verticals_detected": sorted(set(verticals)),
        "stats": {
            "word_count": len(raw.split()),
            "token_count": len(tokens),
            "unique_token_ratio": unique_ratio,
            "has_competitor_framing": bool(_COMPETITOR.search(raw)),
            "has_price_posture_hint": bool(_PRICE.search(raw)),
            "has_moat_language": bool(_MOAT_HINTS.search(raw)),
        },
    }


def heuristic_signals(slots: dict[str, Any]) -> dict[str, Any]:
    raw = str(slots.get("raw_idea", ""))
    stats = slots.get("stats") or {}
    seg = str(slots.get("user_segment_hint") or "").strip().lower()
    seg_ok = bool(seg) and seg != "unspecified"

    has_demand = bool(_PROBLEM_HINTS.search(raw) or _OUTCOME_HINTS.search(raw))
    if not has_demand and int(stats.get("word_count") or 0) >= 14:
        has_demand = True

    has_diff = (
        bool(stats.get("has_moat_language"))
        or bool(stats.get("has_competitor_framing"))
        or float(stats.get("unique_token_ratio") or 0) >= 0.55
        or len(slots.get("verticals_detected") or []) >= 1
        or seg_ok
    )

    legal = bool(_LEGAL_HIGH.search(raw))
    return {
        "has_demand_signal": has_demand,
        "has_differentiation": has_diff,
        "legal_risk_high": legal,
    }
