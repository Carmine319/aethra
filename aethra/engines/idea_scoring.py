"""Deterministic viability scoring — transparent subscores and weights."""

from __future__ import annotations

from typing import Any

from aethra.config import AethraConfig


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def score_demand(slots: dict[str, Any], sig: dict[str, Any]) -> dict[str, Any]:
    raw = str(slots.get("raw_idea", ""))
    stats = slots.get("stats") or {}
    wc = int(stats.get("word_count") or 0)
    pc = str(slots.get("problem_class") or "")

    parts: dict[str, float] = {}
    parts["pain_or_outcome_language"] = 0.35 if pc.startswith("explicit") else 0.22 if "outcome" in pc else 0.12
    parts["description_depth"] = _clamp(0.12 + (wc - 8) * 0.012, 0.0, 0.28)
    parts["segment_specificity"] = 0.18 if sig.get("has_demand_signal") and wc >= 10 else 0.08
    if slots.get("verticals_detected"):
        parts["vertical_anchor"] = min(0.2, 0.08 * len(slots["verticals_detected"]))
    else:
        parts["vertical_anchor"] = 0.0

    total = _clamp(sum(parts.values()), 0.0, 1.0)
    return {"score": round(total, 4), "components": {k: round(v, 4) for k, v in sorted(parts.items())}}


def score_differentiation(slots: dict[str, Any], sig: dict[str, Any]) -> dict[str, Any]:
    stats = slots.get("stats") or {}
    parts: dict[str, float] = {}
    utr = float(stats.get("unique_token_ratio") or 0)
    parts["lexical_diversity"] = _clamp((utr - 0.35) * 1.2 + 0.15, 0.0, 0.28)
    parts["moat_or_wedge_language"] = 0.22 if stats.get("has_moat_language") else 0.06
    parts["competitive_framing"] = 0.14 if stats.get("has_competitor_framing") else 0.04
    parts["geo_or_channel_wedge"] = min(
        0.2,
        0.06 * len(slots.get("geo_hints") or []) + 0.05 * len(slots.get("channel_hints") or []),
    )
    vcount = len(slots.get("verticals_detected") or [])
    parts["vertical_focus"] = min(0.24, 0.1 * max(vcount, 0))

    total = _clamp(sum(parts.values()), 0.0, 1.0)
    if not sig.get("has_differentiation"):
        total = min(total, 0.55)
    return {"score": round(total, 4), "components": {k: round(v, 4) for k, v in sorted(parts.items())}}


def score_clarity(slots: dict[str, Any]) -> dict[str, Any]:
    stats = slots.get("stats") or {}
    wc = int(stats.get("word_count") or 0)
    product_len = len(str(slots.get("product_hypothesis") or ""))
    seg = str(slots.get("user_segment_hint") or "").strip().lower()

    parts = {
        "product_stated": _clamp(product_len / 120.0, 0.0, 0.35),
        "user_stated": 0.25 if seg and seg != "unspecified" else 0.08,
        "problem_class_resolved": 0.2 if not str(slots.get("problem_class", "")).endswith("unspecified") else 0.06,
        "length_adequacy": _clamp((wc - 6) * 0.02, 0.0, 0.3),
    }
    total = _clamp(sum(parts.values()), 0.0, 1.0)
    return {"score": round(total, 4), "components": {k: round(v, 4) for k, v in sorted(parts.items())}}


def score_market_fit(
    saturation_level: str,
    niche_top_score: float,
    kill_market: bool,
) -> dict[str, Any]:
    sat_penalty = {"low": 0.0, "medium": 0.08, "high": 0.22}.get(saturation_level, 0.1)
    base = _clamp(0.35 + niche_top_score * 0.45 - sat_penalty, 0.0, 1.0)
    if kill_market:
        base = min(base, 0.25)
    return {
        "score": round(base, 4),
        "components": {
            "niche_strength_proxy": round(niche_top_score, 4),
            "saturation_penalty": round(sat_penalty, 4),
            "kill_market_applied": kill_market,
        },
    }


def score_execution_readiness(
    cfg: AethraConfig,
    margin_pct: float | None,
    launch_days: int | None,
    filter_pass: bool,
) -> dict[str, Any]:
    parts: dict[str, float] = {}
    if margin_pct is None:
        parts["margin_evidence"] = 0.1
    elif margin_pct >= cfg.min_viability_margin_pct:
        parts["margin_evidence"] = 0.45
    else:
        parts["margin_evidence"] = 0.15

    if launch_days is None:
        parts["launch_window_evidence"] = 0.1
    elif launch_days <= cfg.max_launch_days:
        parts["launch_window_evidence"] = 0.4
    else:
        parts["launch_window_evidence"] = 0.12

    parts["gates_aligned"] = 0.15 if filter_pass else 0.0
    total = _clamp(sum(parts.values()), 0.0, 1.0)
    return {"score": round(total, 4), "components": {k: round(v, 4) for k, v in sorted(parts.items())}}


def composite_viability(
    cfg: AethraConfig,
    demand: float,
    differentiation: float,
    clarity: float,
    market_fit: float,
    execution: float,
) -> tuple[float, dict[str, Any]]:
    weights = {
        "demand": 0.24,
        "differentiation": 0.22,
        "clarity": 0.14,
        "market_fit": 0.22,
        "execution_readiness": 0.18,
    }
    v = (
        demand * weights["demand"]
        + differentiation * weights["differentiation"]
        + clarity * weights["clarity"]
        + market_fit * weights["market_fit"]
        + execution * weights["execution_readiness"]
    )
    v = round(_clamp(v, 0.0, 0.98), 4)
    return v, {"weights": weights, "weighted_inputs": {
        "demand": demand,
        "differentiation": differentiation,
        "clarity": clarity,
        "market_fit": market_fit,
        "execution_readiness": execution,
    }}


def run_idea_scoring(
    cfg: AethraConfig,
    slots: dict[str, Any],
    sig: dict[str, Any],
    market: dict[str, Any],
    filt: Any,
    margin_f: float | None,
    launch_i: int | None,
) -> tuple[float, dict[str, Any]]:
    niche_list = market.get("niche_candidates") or []
    top_niche = float(niche_list[0]["score"]) if niche_list else 0.0

    d1 = score_demand(slots, sig)
    d2 = score_differentiation(slots, sig)
    d3 = score_clarity(slots)
    d4 = score_market_fit(
        str(market.get("saturation_level") or "medium"),
        top_niche,
        bool(market.get("kill_market")),
    )
    d5 = score_execution_readiness(cfg, margin_f, launch_i, filt.pass_filter)

    viability, meta = composite_viability(
        cfg,
        d1["score"],
        d2["score"],
        d3["score"],
        d4["score"],
        d5["score"],
    )

    gate_demand = d1["score"] >= cfg.idea_min_demand_score
    gate_diff = d2["score"] >= cfg.idea_min_differentiation_score

    details = {
        "subscores": {
            "demand": d1,
            "differentiation": d2,
            "clarity": d3,
            "market_fit": d4,
            "execution_readiness": d5,
        },
        "composite": meta,
        "gates": {
            "demand_meets_minimum": gate_demand,
            "differentiation_meets_minimum": gate_diff,
            "min_demand_threshold": cfg.idea_min_demand_score,
            "min_differentiation_threshold": cfg.idea_min_differentiation_score,
            "build_score_threshold": cfg.idea_viability_build_threshold,
            "viability_kill_threshold": cfg.viability_kill_threshold,
        },
    }
    return viability, details
