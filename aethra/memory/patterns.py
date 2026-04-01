"""Deterministic pattern recognition + memory context (no vectors, no new stores)."""

from __future__ import annotations

from typing import Any

from aethra.memory.light import (
    light_memory_file,
    memory_row_blocked_reasons,
    memory_row_build_recommended,
)


def extract_current_signals(out: dict[str, Any], mode: str) -> list[str]:
    dec = out.get("decision") or {}
    val = dec.get("validation") if isinstance(dec.get("validation"), dict) else {}
    sig: list[str] = []

    br = dec.get("blocked_reasons") if isinstance(dec.get("blocked_reasons"), list) else []
    for b in br[:10]:
        sig.append(f"blocker:{b}")

    v = str(dec.get("verdict") or "").lower().strip()
    if v:
        sig.append(f"verdict:{v}")

    if mode == "idea":
        mkt = val.get("market_reality") if isinstance(val.get("market_reality"), dict) else {}
        sat = str(mkt.get("saturation_level") or "").strip()
        if sat:
            sig.append(f"saturation:{sat}")
        if mkt.get("kill_market"):
            sig.append("market:kill_flag")

        n = str(val.get("selected_niche") or "").strip()
        if n:
            sig.append(f"niche:{n}")

        pf = val.get("opportunity_filter") if isinstance(val.get("opportunity_filter"), dict) else {}
        for r in (pf.get("reject_reasons") or [])[:6]:
            sig.append(f"reject:{r}")

    elif mode == "url":
        an = val.get("analysis") if isinstance(val.get("analysis"), dict) else {}
        for g in (an.get("monetisation_gaps") or [])[:3]:
            sig.append(f"gap:{g}")
        for c in (an.get("conversion_issues") or [])[:2]:
            sig.append(f"conversion:{c}")

    elif mode == "miae":
        sig.append("scan:has_opportunities" if dec.get("proceed") else "scan:awaiting_feed")

    return sig


def _tail_runs(runs: list[dict[str, Any]], window: int) -> list[dict[str, Any]]:
    if not runs:
        return []
    return runs[-window:] if len(runs) > window else runs


def _historical_echoes(past: list[dict[str, Any]], window: int = 18) -> list[str]:
    tail = _tail_runs(past, window)
    if len(tail) < 2:
        return []

    echoes: list[str] = []
    blocker_counts: dict[str, int] = {}
    niche_counts: dict[str, int] = {}

    for row in tail:
        if not isinstance(row, dict):
            continue
        for b in memory_row_blocked_reasons(row):
            s = str(b).strip()
            if s:
                blocker_counts[s] = blocker_counts.get(s, 0) + 1
        n = str(row.get("selected_niche") or "").strip()
        if n:
            niche_counts[n] = niche_counts.get(n, 0) + 1

    top_b = sorted(blocker_counts.items(), key=lambda x: (-x[1], x[0]))
    if top_b and top_b[0][1] >= 2:
        b, c = top_b[0]
        echoes.append(
            f"Repeated control signal `{b}` in {c} of the last {len(tail)} stored runs."
        )

    top_n = sorted(niche_counts.items(), key=lambda x: (-x[1], x[0]))
    if top_n and top_n[0][1] >= 3:
        n, c = top_n[0]
        echoes.append(
            f"Similar past ideas clustered on niche `{n.replace('_', ' ')}` ({c} recent records)."
        )

    well = sum(1 for row in tail if isinstance(row, dict) and memory_row_build_recommended(row))
    if well >= 2 and len(tail) >= 4:
        echoes.append(
            f"Memory shows {well} Build outcomes in the recent window; use those as positive templates."
        )

    return echoes[:4]


def _echoes_for_current(
    past: list[dict[str, Any]],
    current_blockers: set[str],
    window: int = 18,
) -> list[str]:
    tail = _tail_runs(past, window)
    extra: list[str] = []
    for b in sorted(current_blockers):
        c = sum(
            1 for row in tail if isinstance(row, dict) and b in memory_row_blocked_reasons(row)
        )
        if c >= 2:
            extra.append(
                f"This run overlaps a recurring friction (`{b}`) seen in {c} recent stored runs."
            )
    return extra[:2]


def attach_pattern_memory_layer(out: dict[str, Any], past_runs: list[dict[str, Any]], mode: str) -> None:
    """
    Add meta.pattern_recognition and meta.memory (hub). Preserves existing meta.memory_similarity.
    """
    meta = out.setdefault("meta", {})
    mode = (mode or "idea").lower().strip()
    signals = extract_current_signals(out, mode)
    echoes = _historical_echoes(past_runs)

    dec = out.get("decision") or {}
    cur_blockers = {str(b) for b in (dec.get("blocked_reasons") or []) if str(b).strip()}
    echoes.extend(_echoes_for_current(past_runs, cur_blockers))

    seen: set[str] = set()
    dedup_echoes: list[str] = []
    for e in echoes:
        if e not in seen:
            seen.add(e)
            dedup_echoes.append(e)

    meta["pattern_recognition"] = {
        "current_signals": sorted(set(signals)),
        "historical_echoes": dedup_echoes[:5],
        "method": "deterministic_keywords_and_frequency",
        "mode": mode,
    }

    integrations = ["light_json_append", "pattern_engine"]
    if mode == "idea":
        integrations.append("similarity_engine")

    mem_hub: dict[str, Any] = {
        "history_run_count": len(past_runs),
        "persist_eligible": not bool(meta.get("cache_hit")),
        "light_memory_file": light_memory_file(),
        "integrations": integrations,
    }
    sim = meta.get("memory_similarity")
    if isinstance(sim, dict) and sim.get("insights"):
        mem_hub["similarity_insight_count"] = len(sim["insights"])
    meta["memory"] = mem_hub
