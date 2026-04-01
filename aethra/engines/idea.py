"""Idea Engine — validation, market reality, niche selection, scored viability."""

from __future__ import annotations

from typing import Any

from aethra.config import AethraConfig
from aethra.control.market_reality import niches_to_json, run_market_reality
from aethra.control.opportunity_filter import run_opportunity_filter
from aethra.engines.idea_extract import extract_idea_slots, heuristic_signals
from aethra.engines.idea_scoring import run_idea_scoring, score_demand, score_differentiation


def _improvements_from_scores(
    slots: dict[str, Any],
    scoring: dict[str, Any],
    margin_f: float | None,
    launch_i: int | None,
    saturation: str,
) -> list[str]:
    out: list[str] = []
    sub = scoring.get("subscores") or {}

    if margin_f is None:
        out.append("Provide assumed_margin_pct from supplier quotes or comparable SKUs.")
    if launch_i is None:
        out.append("Provide launch_days_estimate with a concrete MVP scope.")

    dem = (sub.get("demand") or {}).get("components") or {}
    if dem.get("pain_or_outcome_language", 0) < 0.2:
        out.append("State explicit pain, risk, or measurable outcome (time, money, errors avoided).")

    dif = (sub.get("differentiation") or {}).get("components") or {}
    if dif.get("lexical_diversity", 0) < 0.15 and dif.get("moat_or_wedge_language", 0) < 0.1:
        out.append("Add wedge: geography, vertical, integration, or proof of why switching wins.")

    clr = (sub.get("clarity") or {}).get("components") or {}
    if clr.get("user_stated", 0) < 0.12:
        out.append("Name the ICP (role, company size, region) explicitly.")

    if saturation == "high":
        out.append("Saturation risk: pick the highest-scoring niche below and narrow the promise.")

    mk = (sub.get("market_fit") or {}).get("components") or {}
    if mk.get("saturation_penalty", 0) >= 0.15:
        out.append("Reduce generic category language; anchor to a measurable workflow or buyer.")

    ex = (sub.get("execution_readiness") or {}).get("components") or {}
    if ex.get("margin_evidence", 0) < 0.2:
        out.append("Lock unit economics: COGS, fees, shipping, and floor price for 60%+ gross margin path.")

    if not slots.get("verticals_detected"):
        out.append("Optional: add category_keywords in context to tune niche scoring.")

    return sorted(set(out))


def run_idea_engine(
    cfg: AethraConfig,
    idea_text: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ctx = context or {}
    slots = extract_idea_slots(idea_text)
    sig = heuristic_signals(slots)

    demand_eval = score_demand(slots, sig)
    diff_eval = score_differentiation(slots, sig)

    margin = ctx.get("assumed_margin_pct")
    margin_f = float(margin) if margin is not None and str(margin).strip() != "" else None

    launch_days = ctx.get("launch_days_estimate")
    launch_i = int(launch_days) if launch_days is not None and str(launch_days).strip() != "" else None

    filt = run_opportunity_filter(
        cfg=cfg,
        has_demand_signal=demand_eval["score"] >= cfg.idea_min_demand_score,
        has_differentiation=diff_eval["score"] >= cfg.idea_min_differentiation_score,
        margin_pct=margin_f,
        launch_days=launch_i,
        legal_risk_high=bool(sig["legal_risk_high"]),
    )

    cats = ctx.get("category_keywords")
    cat_list = [str(x) for x in cats] if isinstance(cats, list) else []
    mkt = run_market_reality(slots["raw_idea"], cat_list, slots=slots, cfg=cfg)

    niche_json = niches_to_json(mkt, cat_list)
    candidates = niche_json.get("niche_candidates") or []
    top = candidates[0] if candidates else {}
    best_niche = str(top.get("label", ""))

    viability, scoring = run_idea_scoring(cfg, slots, sig, niche_json, filt, margin_f, launch_i)

    gates = scoring.get("gates") or {}
    floor = float(cfg.viability_kill_threshold)
    killed_low_viability = viability < floor
    build = (
        filt.pass_filter
        and not mkt.kill_market
        and not killed_low_viability
        and viability >= float(gates.get("build_score_threshold", cfg.idea_viability_build_threshold))
        and bool(gates.get("demand_meets_minimum"))
        and bool(gates.get("differentiation_meets_minimum"))
    )

    improvements = _improvements_from_scores(
        slots, scoring, margin_f, launch_i, str(niche_json.get("saturation_level") or "")
    )

    best_version = str(slots.get("product_hypothesis") or "").strip()
    if best_niche:
        niche_title = best_niche.replace("_", " ")
        best_version = f"{best_version} - niche: {niche_title}"

    build_blockers: list[str] = []
    if not filt.pass_filter:
        build_blockers.extend(filt.reject_reasons)
    if mkt.kill_market:
        build_blockers.append(str(mkt.kill_reason or "market_killed"))
    if killed_low_viability:
        build_blockers.append("viability_below_60_pct_floor")
    elif viability < cfg.idea_viability_build_threshold:
        build_blockers.append("viability_below_build_threshold")
    if not gates.get("demand_meets_minimum"):
        build_blockers.append("demand_subscore_below_minimum")
    if not gates.get("differentiation_meets_minimum"):
        build_blockers.append("differentiation_subscore_below_minimum")

    return {
        "type": "idea",
        "slots": slots,
        "signal_summary": {
            "heuristic_legal_risk": bool(sig["legal_risk_high"]),
            "demand_subscore": demand_eval["score"],
            "differentiation_subscore": diff_eval["score"],
        },
        "viability_score": viability,
        "viability_0_100": int(round(viability * 100)),
        "killed_low_viability": killed_low_viability,
        "scoring": scoring,
        "build": build,
        "build_blockers": sorted(set(build_blockers)),
        "selected_niche": best_niche,
        "selected_niche_profile": top,
        "improvements": improvements,
        "best_version": best_version[:400],
        "opportunity_filter": {
            "pass": filt.pass_filter,
            "reject_reasons": filt.reject_reasons,
            "flags": filt.flags,
        },
        "market_reality": niche_json,
    }
