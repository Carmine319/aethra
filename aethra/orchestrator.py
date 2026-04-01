"""Public orchestration API."""

from __future__ import annotations

from typing import Any

from aethra.api_schema import meta_api_block
from aethra.config import load_config
from aethra.engines.miae import run_miae
from aethra.engines.next_best_actions import build_next_best_actions
from aethra.public_output import ensure_public_shape
from aethra.pipelines.idea_flow import run_idea_pipeline
from aethra.pipelines.url_flow import run_url_pipeline
from aethra.util_json import canonical_dumps


def _persist_light_memory(out: dict[str, Any]) -> None:
    if (out.get("meta") or {}).get("cache_hit"):
        return
    try:
        from aethra.memory.light import saveMemory

        saveMemory(out)
    except OSError:
        pass


def run_miae_standalone(context: dict[str, Any] | None = None) -> dict[str, Any]:
    from aethra.memory.light import loadMemory
    from aethra.memory.patterns import attach_pattern_memory_layer

    cfg = load_config()
    past = loadMemory()
    mi = run_miae(cfg, context)
    opps = mi.get("opportunities") or []
    has_data = bool(opps)
    summary = (
        "Ranked opportunity hypotheses are ready for IDEA validation (attach sources per item)."
        if has_data
        else "Scan idle: inject trend_summaries with title, gap_hypothesis, score, and source_ref—no synthetic markets."
    )
    if mi.get("allocation_hint"):
        summary = f"{summary} {mi['allocation_hint']}"

    public = {
        "decision": {
            "verdict": "advance" if has_data else "hold",
            "proceed": has_data,
            "build_recommended": False,
            "opportunities": opps[: cfg.max_opportunities_returned],
            "requires_external_feed": mi.get("requires_external_feed"),
            "allocation_hint": mi.get("allocation_hint"),
            "note": mi.get("note"),
            "executive_summary": summary,
        },
        "strategy": {},
        "monetisation": {},
        "brand": {},
        "execution": {},
        "portfolio": {},
        "meta": {
            "system": "aethra_qppp",
            "api": meta_api_block(),
            "module": "market_intelligence",
            "flow_completed": ["discover"],
        },
    }
    ex0 = public.setdefault("execution", {})
    ex0["next_best_actions"] = build_next_best_actions(
        mode="miae",
        idea_payload=None,
        analysis_payload=None,
        page_title="",
        monetisation={},
        brand={},
        execution={},
        context=dict(context or {}),
        decision=public["decision"],
    )
    out = ensure_public_shape(public)
    attach_pattern_memory_layer(out, past, "miae")
    _persist_light_memory(out)
    return out


def run_idea(idea_text: str, context: dict[str, Any] | None = None, *, use_cache: bool = True) -> dict[str, Any]:
    from aethra.memory.light import loadMemory
    from aethra.memory.patterns import attach_pattern_memory_layer
    from aethra.memory.similarity import attach_memory_similarity

    past = loadMemory()
    out = run_idea_pipeline(load_config(), idea_text, context, use_cache=use_cache)
    attach_memory_similarity(out, idea_text, past)
    attach_pattern_memory_layer(out, past, "idea")
    _persist_light_memory(out)
    return out


def run_url(url: str, context: dict[str, Any] | None = None, *, use_cache: bool = True) -> dict[str, Any]:
    from aethra.memory.light import loadMemory
    from aethra.memory.patterns import attach_pattern_memory_layer

    past = loadMemory()
    out = run_url_pipeline(load_config(), url, context, use_cache=use_cache)
    attach_pattern_memory_layer(out, past, "url")
    _persist_light_memory(out)
    return out


def dump_json(data: Any) -> str:
    return canonical_dumps(data)
