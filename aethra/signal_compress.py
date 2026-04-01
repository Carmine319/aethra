"""
Presentation-only signal compression for human summaries.
Does not alter API envelopes or JSON payloads — use only for CLI/brief text.
"""

from __future__ import annotations

import re
from typing import Any

MAX_BULLETS = 3

_TOKEN = re.compile(r"[a-z0-9]{3,}", re.I)

# Phrases that add no actionable signal in a brief (point users to JSON instead of value).
_GENERIC_MARKERS = (
    "review decision.validation",
    "strategy json for full",
    "open execution.execution_checklist",
    "see strategy.strategic_engine",
    "full ordered list",
    "model confidence from control-plane gates",
    "gates support allocating capital to a disciplined launch path",
    "risk or policy gates block recommended build",
    "address blockers before spend",
    "confirm supplier quotes, compliance, and channel before scaling",
)


def _tokens(s: str) -> set[str]:
    return {m.group(0).lower() for m in _TOKEN.finditer(s or "")}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    u = a | b
    return len(a & b) / len(u) if u else 0.0


def is_generic_line(text: str) -> bool:
    low = " ".join((text or "").lower().split())
    return any(m in low for m in _GENERIC_MARKERS)


def humanize_token(s: str) -> str:
    t = str(s or "").strip().replace("_", " ")
    return " ".join(t.split())


def compress_bullets(raw: list[str], *, max_n: int = MAX_BULLETS) -> list[str]:
    """Order-preserving: drop generic lines, exact dupes, and near-duplicate overlap."""
    cleaned: list[str] = []
    for x in raw:
        t = " ".join((x or "").split())
        if len(t) < 4 or is_generic_line(t):
            continue
        cleaned.append(t)

    seen_norm: set[str] = set()
    uniq: list[str] = []
    for t in cleaned:
        k = t.lower()
        if k in seen_norm:
            continue
        seen_norm.add(k)
        uniq.append(t)

    out: list[str] = []
    for t in uniq:
        wt = _tokens(t)
        redundant = False
        for e in out:
            we = _tokens(e)
            j = _jaccard(wt, we)
            if j >= 0.72:
                redundant = True
                break
            el, tl = e.lower(), t.lower()
            if len(tl) >= 24 and len(el) >= 24 and (tl in el or el in tl):
                redundant = True
                break
        if not redundant:
            out.append(t)
        if len(out) >= max_n:
            break
    return out[:max_n]


def used_text_blob(strings: list[str]) -> str:
    return " ".join(s.lower() for s in strings if s)


def confidence_tail(dec: dict[str, Any], *, avoid_substring_of: str) -> str:
    """Short driver for confidence line; skips text already covered in the brief."""
    avoid = (avoid_substring_of or "").lower()
    br = dec.get("blocked_reasons") if isinstance(dec.get("blocked_reasons"), list) else []
    for b in br[:4]:
        hb = humanize_token(str(b))
        if len(hb) < 4:
            continue
        low = hb.lower()
        if low in avoid:
            continue
        return hb[:100]
    es = " ".join(str(dec.get("executive_summary") or "").split())
    if not es:
        return ""
    es_l = es.lower()
    head = es_l[: min(90, len(es_l))]
    if head and head in avoid:
        return ""
    return es[:110] + ("..." if len(es) > 110 else "")
