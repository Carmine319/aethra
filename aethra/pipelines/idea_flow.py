"""IDEA pipeline — spec flow: VALIDATE → STRATEGY → PREDICT → MONETISE → BRAND → EXECUTE → PORTFOLIO → LEARN."""

from __future__ import annotations

from typing import Any

from aethra.config import AethraConfig, memory_dir
from aethra.control.control_plane import run_control_plane
from aethra.control.intent import evaluate_intent_lock
from aethra.engines.abge import run_abge
from aethra.engines.idea import run_idea_engine
from aethra.engines.iepe import run_iepe
from aethra.engines.next_best_actions import build_next_best_actions
from aethra.engines.mieae import run_mieae
from aethra.engines.monetisation import run_monetisation
from aethra.engines.pcs import run_pcs
from aethra.engines.pex import run_pex
from aethra.engines.sie import run_sie
from aethra.memory.store import VersionedMemoryStore
from aethra.public_output import (
    executive_summary_idea,
    monetisation_thesis,
    scores_0_100,
    strategy_narrative,
    ensure_public_shape,
)
from aethra.api_schema import meta_api_block
from aethra.util_json import content_hash


def _confidence_from_parts(viability: float, strat_score: float, pex_prob: float) -> float:
    return round(min(1.0, max(0.0, (viability + strat_score + pex_prob) / 3.0)), 4)


def _verdict(*, intent_ok: bool, killed_viability: bool, killed_market: bool, proceed: bool, build: bool) -> str:
    if not intent_ok or killed_viability or killed_market:
        return "kill"
    if proceed and build:
        return "advance"
    return "hold"


def run_idea_pipeline(
    cfg: AethraConfig,
    idea_text: str,
    context: dict[str, Any] | None = None,
    store: VersionedMemoryStore | None = None,
    use_cache: bool = True,
) -> dict[str, Any]:
    ctx = dict(context or {})
    st = store or VersionedMemoryStore(memory_dir())

    cache_key = f"idea_{content_hash({'text': idea_text, 'ctx': ctx})}"
    if use_cache:
        hit = st.get_valid_cache(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit.setdefault("meta", {})["cache_hit"] = True
            return ensure_public_shape(hit)

    intent = evaluate_intent_lock(idea_text)
    idea = run_idea_engine(cfg, idea_text, ctx)
    sie = run_sie(cfg, "idea", idea_payload=idea, analysis_payload=None)
    pex = run_pex(idea, sie["selected"], ctx)

    viability = float(idea["viability_score"])
    strat_score = float(sie["selected"]["score"])
    pex_prob = float(pex["estimated_positive_reaction_probability"])
    conf = _confidence_from_parts(viability, strat_score, pex_prob)

    mkt = idea.get("market_reality") or {}
    killed_viability = bool(idea.get("killed_low_viability"))
    killed_market = bool(mkt.get("kill_market"))

    ctrl = run_control_plane(
        cfg=cfg,
        intent_allowed=intent.allowed,
        filter_pass=bool(idea.get("opportunity_filter", {}).get("pass")),
        kill_market=killed_market,
        model_confidence=conf,
        viability_below_floor=killed_viability,
    )

    monet = run_monetisation("idea", idea_payload=idea, analysis_payload=None, context=ctx)
    monet = dict(monet)
    monet["consultant_thesis"] = monetisation_thesis(monet)

    brand = run_abge(idea_text, str(idea.get("selected_niche", "")))
    brand = dict(brand)
    brand["headline"] = f"{brand.get('brand_name', '').strip()}: {brand.get('tagline', '').strip()}"[:200]

    iepe = run_iepe(idea, ctx)
    iepe = dict(iepe)
    iepe["next_best_actions"] = build_next_best_actions(
        mode="idea",
        idea_payload=idea,
        analysis_payload=None,
        page_title="",
        monetisation=monet,
        brand=brand,
        execution=iepe,
        context=ctx,
        decision=None,
    )
    pcs = run_pcs(cfg, ctx)
    macro = run_mieae(ctx)

    dem = float((idea.get("signal_summary") or {}).get("demand_subscore") or 0.0)
    dif = float((idea.get("signal_summary") or {}).get("differentiation_subscore") or 0.0)
    score_triple = scores_0_100(dem, dif, viability)

    build_rec = bool(idea.get("build")) and ctrl.proceed
    verdict = _verdict(
        intent_ok=intent.allowed,
        killed_viability=killed_viability,
        killed_market=killed_market,
        proceed=ctrl.proceed,
        build=bool(idea.get("build")),
    )

    objections = ", ".join(pex.get("objections_to_address") or [])
    pred_path = (pex.get("selected_pricing_path") or {}).get("label", "")
    predictive_summary = (
        f"Pricing path '{pred_path}' maximises structural conversion lift vs alternatives; "
        f"pre-handle objections: {objections}."
    )

    decision: dict[str, Any] = {
        "verdict": verdict,
        "proceed": ctrl.proceed,
        "build_recommended": build_rec,
        "scores": score_triple,
        "killed_low_viability": killed_viability,
        "killed_weak_market": killed_market,
        "blocked_reasons": ctrl.blocked_reasons,
        "confidence_0_100": int(round(ctrl.confidence * 100)),
        "intent": {"allowed": intent.allowed, "violations": intent.violations},
        "executive_summary": executive_summary_idea(
            killed_viability=killed_viability,
            killed_market=killed_market,
            intent_ok=intent.allowed,
            proceed=ctrl.proceed,
            build=bool(idea.get("build")),
        ),
        "validation": idea,
    }

    strategy: dict[str, Any] = {
        "narrative": strategy_narrative(sie["selected"]),
        "strategic_engine": {
            "candidates": sie["candidates"],
            "selected": sie["selected"],
            "rationale": sie.get("rationale"),
        },
        "predictive_engine": {
            "estimated_positive_reaction_probability": pex.get("estimated_positive_reaction_probability"),
            "pricing_paths_evaluated": pex.get("pricing_paths_evaluated"),
            "selected_pricing_path": pex.get("selected_pricing_path"),
            "scenario_matrix": pex.get("scenario_matrix"),
            "objections_to_address": pex.get("objections_to_address"),
            "summary": predictive_summary,
            "disclaimer": pex.get("disclaimer"),
        },
        "macro_engine": {
            "geopolitical_risk": macro.get("geopolitical_risk"),
            "economic_conditions": macro.get("economic_conditions"),
            "seasonality": macro.get("seasonality"),
            "strategy_adjustment": macro.get("strategy_adjustment"),
            "confidence": macro.get("confidence"),
            "policy": macro.get("policy"),
            "timing_note": macro.get("timing_note"),
        },
    }
    if macro.get("strategy_adjustment"):
        strategy["macro_engine"]["timing_note"] = (
            "High-confidence macro signal: align launch windows and messaging with the stated adjustment."
        )

    public = {
        "decision": decision,
        "strategy": strategy,
        "monetisation": monet,
        "brand": brand,
        "execution": iepe,
        "portfolio": pcs,
        "meta": {
            "system": "aethra_qppp",
            "api": meta_api_block(),
            "flow_completed": [
                "validate",
                "strategy",
                "predict",
                "monetise",
                "brand",
                "execute",
                "portfolio",
                "learn",
            ],
            "modules": [
                "market_reality",
                "idea_engine",
                "strategic_engine",
                "predictive_engine",
                "monetisation_engine",
                "brand_engine",
                "industrial_execution_engine",
                "portfolio_system",
                "macro_engine",
                "meta_engine",
            ],
            "blocked": not ctrl.proceed,
        },
    }

    from aethra.engines.mige import run_mige_public

    mige = run_mige_public(public=public, intent_violations=intent.violations)
    public["meta"]["governance"] = mige
    public["meta"]["learn"] = {
        "patterns_extracted": mige.get("patterns_extracted"),
        "improvement_directives": mige.get("correction_actions"),
    }

    from aethra.engines.nemde import run_nemde

    nem = run_nemde(st, "idea_runs", public)
    public["meta"]["learn"]["memory_version_id"] = nem.get("stored_version_id")

    out = ensure_public_shape(public)
    st.set_cache(cache_key, out, cfg.cache_ttl_seconds)
    return out
