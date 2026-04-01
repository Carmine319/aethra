"""Lightweight idea similarity vs memory runs — keywords + string ratio (stdlib only)."""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any

from aethra.memory.light import memory_row_outcome_tag, memory_row_viability_0_100

_TOKEN = re.compile(r"[a-z0-9]{3,}", re.I)


def _norm_words(text: str) -> set[str]:
    return {m.group(0).lower() for m in _TOKEN.finditer(text or "")}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    u = a | b
    if not u:
        return 0.0
    return len(a & b) / len(u)


def _char_ratio(a: str, b: str) -> float:
    x = " ".join((a or "").lower().split())
    y = " ".join((b or "").lower().split())
    if not x or not y:
        return 0.0
    return float(SequenceMatcher(None, x, y).ratio())


def _combined_score(new_text: str, past_idea: str) -> float:
    wa = _norm_words(new_text)
    wb = _norm_words(past_idea)
    j = _jaccard(wa, wb)
    c = _char_ratio(new_text, past_idea)
    return round(0.45 * j + 0.55 * c, 4)


def _viability(run: dict[str, Any]) -> int:
    return memory_row_viability_0_100(run)


def _performed_well(run: dict[str, Any]) -> bool:
    if memory_row_outcome_tag(run) == "build":
        return True
    dec = run.get("decision") if isinstance(run.get("decision"), dict) else {}
    if dec.get("build_recommended"):
        return True
    if str(dec.get("verdict") or "").lower() == "advance" and dec.get("proceed"):
        return True
    v = _viability(run)
    return v >= 60


def _performed_poorly(run: dict[str, Any]) -> bool:
    if memory_row_outcome_tag(run) == "kill":
        return True
    dec = run.get("decision") if isinstance(run.get("decision"), dict) else {}
    if str(dec.get("verdict") or "").lower() == "kill":
        return True
    return _viability(run) < 40


def _niche_label(run: dict[str, Any]) -> str:
    n = str(run.get("selected_niche") or "").strip().replace("_", " ")
    return n or "unspecified"


def _snippet(text: str, n: int = 56) -> str:
    t = " ".join((text or "").split())
    if len(t) <= n:
        return t
    return t[: n - 1].rstrip() + "..."


def _outcome_tag(run: dict[str, Any]) -> str:
    return memory_row_outcome_tag(run)


def find_similar_runs(
    new_idea_text: str,
    past_runs: list[dict[str, Any]],
    *,
    min_score: float = 0.2,
    limit: int = 5,
) -> list[tuple[dict[str, Any], float]]:
    if not (new_idea_text or "").strip():
        return []
    ranked: list[tuple[dict[str, Any], float]] = []
    for run in past_runs:
        if not isinstance(run, dict):
            continue
        past_idea = str(run.get("idea") or "").strip()
        if not past_idea:
            continue
        sc = _combined_score(new_idea_text, past_idea)
        if sc < min_score:
            continue
        ranked.append((run, sc))
    ranked.sort(key=lambda x: (-x[1], -(x[0].get("ts_ms") or 0)))
    return ranked[:limit]


def build_insights(new_idea_text: str, ranked: list[tuple[dict[str, Any], float]]) -> list[str]:
    if not (new_idea_text or "").strip():
        return ["Idea text empty; similarity skipped."]
    if not ranked:
        return ["No close matches in local memory yet; history will sharpen after more runs."]

    insights: list[str] = []
    for run, sc in ranked[:3]:
        pct = int(round(sc * 100))
        snip = _snippet(run.get("idea") or "")
        niche = _niche_label(run)
        if _performed_well(run):
            if niche != "unspecified":
                insights.append(
                    f"Similar past idea ({snip}) performed well in niche {niche} "
                    f"({pct}% match)."
                )
            else:
                insights.append(
                    f"Similar past idea ({snip}) previously cleared a positive path ({pct}% match)."
                )
        elif _performed_poorly(run):
            insights.append(
                f"Overlapping past idea ({snip}) struggled ({pct}% match); compare blockers before repeating."
            )
        else:
            insights.append(
                f"Past run ~{pct}% keyword/string overlap ({snip}); niche {niche}; outcome {_outcome_tag(run)}."
            )

    return insights


def build_actionable_learnings(
    ranked: list[tuple[dict[str, Any], float]],
    *,
    limit: int = 3,
) -> list[dict[str, str]]:
    """
    UI-oriented cards: what to avoid, why (from memory outcome), what to do instead.
    One card per top similar run (max `limit`).
    """
    cards: list[dict[str, str]] = []
    for run, sc in ranked[:limit]:
        pct = int(round(sc * 100))
        snip = _snippet(run.get("idea") or "", 72)
        niche = _niche_label(run)
        tag = _outcome_tag(run)
        v = _viability(run)

        if _performed_poorly(run):
            avoid = f'The same broad shape as «{snip}» (overlapping keywords, {pct}% match)'
            why = (
                f"That run landed as {tag} in memory (viability index ~{v}); filters or market "
                "signals did not clear before spend."
            )
            if niche != "unspecified":
                do_instead = (
                    f'Niche tighter than «{niche}»: name a specific ICP (role, constraint, shift, '
                    "or workflow) and validate one channel before widening."
                )
            else:
                do_instead = (
                    "Pick one wedge: who pays, what job you own, and one proof metric—then compare "
                    "blockers in Raw JSON so you do not repeat the same miss."
                )
        elif _performed_well(run):
            avoid = f'Discarding the wedge pattern that worked for «{snip}» ({pct}% match)'
            why = (
                f"Memory shows a positive path ({tag}, viability ~{v}); the risk is diluting "
                "positioning that already cleared governance."
            )
            if niche != "unspecified":
                do_instead = (
                    f'Keep «{niche}» sharp; add quotes, margin proof, and one acquisition motion '
                    "before expanding audience or SKUs."
                )
            else:
                do_instead = (
                    "Lock unit economics and one repeatable acquisition loop before broadening "
                    "the offer or niche."
                )
        else:
            avoid = f'Treating «{snip}» as a proven playbook ({pct}% overlap)'
            why = (
                f"That run was mixed ({tag}, viability ~{v})—not a clean build or kill—so copying "
                "it blindly adds execution risk."
            )
            do_instead = (
                "Run a short demand and margin check on one ICP; if launch signal stays unclear, "
                "pause paid scale until you have receipts."
            )

        cards.append({"avoid": avoid, "why": why, "do_instead": do_instead})

    return cards


def build_memory_insight(
    new_idea_text: str,
    past_runs: list[dict[str, Any]],
    *,
    min_score: float = 0.22,
    max_patterns: int = 2,
) -> str | None:
    """
    Top 1–2 keyword-similar memory rows as one human-readable line for idea mode.
    Uses the same Jaccard + char ratio as find_similar_runs (no vectors).
    """
    ranked = find_similar_runs(new_idea_text, past_runs, min_score=min_score, limit=max_patterns)
    if not ranked:
        return None
    parts: list[str] = []
    for run, sc in ranked[:max_patterns]:
        pct = int(round(sc * 100))
        niche = _niche_label(run)
        niche_phrase = f"the {niche} niche" if niche != "unspecified" else "a comparable wedge"
        if _performed_well(run):
            parts.append(f"Similar idea performed well in {niche_phrase} ({pct}% keyword match).")
        elif _performed_poorly(run):
            parts.append(
                f"Similar idea struggled in {niche_phrase} ({pct}% keyword match); compare blockers."
            )
        else:
            parts.append(
                f"Similar past idea in {niche_phrase} ended as {_outcome_tag(run)} ({pct}% keyword match)."
            )
    return " ".join(parts) if parts else None


def build_similarity_payload(
    new_idea_text: str,
    past_runs: list[dict[str, Any]],
) -> dict[str, Any]:
    ranked = find_similar_runs(new_idea_text, past_runs)
    similar_runs: list[dict[str, Any]] = []
    for run, sc in ranked:
        similar_runs.append(
            {
                "similarity_0_100": int(round(sc * 100)),
                "idea_snippet": _snippet(run.get("idea") or "", 80),
                "selected_niche": str(run.get("selected_niche") or ""),
                "outcome": _outcome_tag(run),
                "ts_ms": run.get("ts_ms"),
            }
        )
    return {
        "insights": build_insights(new_idea_text, ranked),
        "actionable_learnings": build_actionable_learnings(ranked),
        "similar_runs": similar_runs,
        "method": "keyword_jaccard_plus_sequence_ratio",
    }


def attach_memory_similarity(out: dict[str, Any], new_idea_text: str, past_runs: list[dict[str, Any]]) -> None:
    """Merge into meta; does not alter decision/strategy JSON keys."""
    meta = out.setdefault("meta", {})
    meta["memory_similarity"] = build_similarity_payload(new_idea_text, past_runs)
    mi = build_memory_insight(new_idea_text, past_runs)
    if mi:
        meta["memory_insight"] = mi
    else:
        meta.pop("memory_insight", None)
