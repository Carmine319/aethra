"""URL pipeline — full engine chain: ingest → analyse → strategy → predict → monetise → brand → execute → portfolio → macro → learn."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from aethra.api_schema import meta_api_block
from aethra.config import AethraConfig, memory_dir
from aethra.control.intent import evaluate_intent_lock
from aethra.engines.abge import run_abge
from aethra.engines.analysis import run_analysis
from aethra.engines.iepe import run_iepe
from aethra.engines.next_best_actions import build_next_best_actions
from aethra.engines.ingestion import run_ingestion
from aethra.engines.mieae import run_mieae
from aethra.engines.monetisation import run_monetisation
from aethra.engines.pcs import run_pcs
from aethra.engines.pex import run_pex
from aethra.engines.sie import run_sie
from aethra.memory.store import VersionedMemoryStore
from aethra.public_output import ensure_public_shape, monetisation_thesis, strategy_narrative
from aethra.util_json import content_hash


def _url_scores(conf: float, analysis: dict[str, Any], ok: bool) -> dict[str, int]:
    if not ok:
        return {"demand_0_100": 0, "differentiation_0_100": 0, "viability_0_100": 0}
    issue_n = int(analysis.get("issue_count") or 0)
    base = int(round(conf * 100))
    dem = max(0, min(95, 48 + base // 4 - min(issue_n * 4, 28)))
    diff = max(0, min(92, 40 + int((1 - min(issue_n, 10) / 10) * 38)))
    via = max(0, min(94, base - min(issue_n * 2, 18)))
    return {"demand_0_100": dem, "differentiation_0_100": diff, "viability_0_100": via}


def run_url_pipeline(
    cfg: AethraConfig,
    url: str,
    context: dict[str, Any] | None = None,
    store: VersionedMemoryStore | None = None,
    use_cache: bool = True,
) -> dict[str, Any]:
    ctx = dict(context or {})
    st = store or VersionedMemoryStore(memory_dir())

    cache_key = f"url_{content_hash({'url': url, 'ctx': ctx})}"
    if use_cache:
        hit = st.get_valid_cache(cache_key)
        if hit is not None:
            hit = dict(hit)
            hit.setdefault("meta", {})["cache_hit"] = True
            return ensure_public_shape(hit)

    ing = run_ingestion(url, cfg)
    analysis = run_analysis(ing) if ing.get("ok") else {"error": "ingestion_failed", "issue_count": 0}

    text_for_intent = f"{ing.get('title','')} {ing.get('trimmed_text','')[:2000]}"
    intent = evaluate_intent_lock(text_for_intent)

    char_count = int(ing.get("char_count") or 0)
    conf = round(min(0.9, 0.45 + char_count / 25000.0), 4)
    if not ing.get("ok"):
        conf = 0.2

    blocked_reasons: list[str] = []
    if not intent.allowed:
        blocked_reasons.append("intent_lock_failed")
    if not ing.get("ok"):
        blocked_reasons.append("ingestion_failed")
    if ing.get("ok") and char_count < 80:
        blocked_reasons.append("insufficient_trimmed_content")

    proceed = len(blocked_reasons) == 0 and conf >= cfg.control_min_confidence

    sie = run_sie(cfg, "url", idea_payload=None, analysis_payload=analysis if ing.get("ok") else None)

    title = str(ing.get("title") or "").strip() or urlparse(url).netloc or "landing_page"
    raw_idea = f"Landing page: {title}"
    url_stub: dict[str, Any] = {
        "viability_score": round(min(0.88, conf * 0.9), 4) if ing.get("ok") else 0.22,
        "slots": {
            "product_hypothesis": title[:280],
            "raw_idea": raw_idea,
            "user_segment_hint": "site_visitors",
            "problem_class": "url_conversion_audit",
        },
    }
    pex = run_pex(url_stub, sie["selected"], ctx)

    monet = run_monetisation(
        "url",
        idea_payload=url_stub,
        analysis_payload=analysis if ing.get("ok") else None,
        context=ctx,
    )
    monet = dict(monet)
    monet["consultant_thesis"] = monetisation_thesis(monet)

    brand = run_abge(f"Validate idea: {raw_idea}", "conversion_optimisation_wedge")
    brand = dict(brand)
    brand["headline"] = f"{brand.get('brand_name', '').strip()}: {brand.get('tagline', '').strip()}"[:200]

    iepe = run_iepe(url_stub, ctx)
    iepe = dict(iepe)
    page_title = str(ing.get("title") or "").strip() or (urlparse(url).netloc or "this page")
    iepe["next_best_actions"] = build_next_best_actions(
        mode="url",
        idea_payload=url_stub,
        analysis_payload=analysis if isinstance(analysis, dict) else None,
        page_title=page_title,
        monetisation=monet,
        brand=brand,
        execution=iepe,
        context=ctx,
        decision=None,
    )
    pcs = run_pcs(cfg, ctx)
    macro = run_mieae(ctx)

    score_triple = _url_scores(conf, analysis if isinstance(analysis, dict) else {}, bool(ing.get("ok")))

    objections = ", ".join(pex.get("objections_to_address") or [])
    pred_path = (pex.get("selected_pricing_path") or {}).get("label", "")
    predictive_summary = (
        f"Page-level forecast uses structural pricing path '{pred_path}'; "
        f"address {objections} adjacent to primary CTA and pricing."
    )

    verdict = "kill" if not intent.allowed else ("advance" if proceed else "hold")

    decision: dict[str, Any] = {
        "verdict": verdict,
        "proceed": proceed,
        "build_recommended": False,
        "scores": score_triple,
        "killed_low_viability": False,
        "killed_weak_market": False,
        "blocked_reasons": sorted(set(blocked_reasons)),
        "confidence_0_100": int(round(conf * 100)),
        "intent": {"allowed": intent.allowed, "violations": intent.violations},
        "executive_summary": (
            "URL pass: fix priority issues in order, then re-test conversion before scaling traffic."
            if proceed
            else "Hold: resolve fetch or intent blockers, or increase crawlable copy depth, then re-run."
        ),
        "validation": {
            "ingestion": ing,
            "analysis": analysis,
            "synthetic_idea_stub_for_engines": url_stub,
        },
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
                "ingest",
                "analyse",
                "strategy",
                "predict",
                "monetise",
                "brand",
                "execute",
                "portfolio",
                "macro",
                "learn",
            ],
            "modules": [
                "ingestion_engine",
                "analysis_engine",
                "strategic_engine",
                "predictive_engine",
                "monetisation_engine",
                "brand_engine",
                "industrial_execution_engine",
                "portfolio_system",
                "macro_engine",
                "meta_engine",
            ],
            "blocked": not proceed,
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

    nem = run_nemde(st, "url_runs", public)
    public["meta"]["learn"]["memory_version_id"] = nem.get("stored_version_id")

    out = ensure_public_shape(public)
    st.set_cache(cache_key, out, cfg.cache_ttl_seconds)
    return out
