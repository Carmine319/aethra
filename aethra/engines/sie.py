"""SIE — Strategic Intelligence Engine: 3 strategies, select 1."""

from __future__ import annotations

from typing import Any

from aethra.config import AethraConfig


def _score_strategy(name: str, weights: dict[str, float]) -> float:
    w = weights.get(name, 0.5)
    return round(min(0.95, 0.4 + w * 0.5), 4)


def run_sie(
    cfg: AethraConfig,
    mode: str,
    idea_payload: dict[str, Any] | None = None,
    analysis_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    weights = {
        "A_narrow_icp_channel_fit": 0.72,
        "B_pricing_and_offer_ladder": 0.68,
        "C_partnership_or_embedded_distribution": 0.55,
    }
    _hooks = {
        "A": ["define_icp_one_pager", "single_channel_30_day_experiment", "weekly_cac_review"],
        "B": ["publish_pricing_and_value_metric", "good_better_best_tiers", "roi_worked_example"],
        "C": ["list_partner_targets", "pilot_one_embed_workflow", "co_marketing_first_partner"],
    }
    strategies = [
        {
            "id": "A",
            "name": "A_narrow_icp_channel_fit",
            "summary": "Tight ICP, one channel, repeatable motion; reduce CAC via focus.",
            "score": _score_strategy("A_narrow_icp_channel_fit", weights),
            "execution_hooks": _hooks["A"],
        },
        {
            "id": "B",
            "name": "B_pricing_and_offer_ladder",
            "summary": "Packaging ladder with clear ROI narrative; upsell path explicit.",
            "score": _score_strategy("B_pricing_and_offer_ladder", weights),
            "execution_hooks": _hooks["B"],
        },
        {
            "id": "C",
            "name": "C_partnership_or_embedded_distribution",
            "summary": "Integrate into existing workflows; partner-led demand.",
            "score": _score_strategy("C_partnership_or_embedded_distribution", weights),
            "execution_hooks": _hooks["C"],
        },
    ]
    strategies = sorted(strategies, key=lambda s: (-s["score"], s["id"]))[: cfg.max_strategies_generated]
    selected = strategies[0]

    if mode == "url" and analysis_payload:
        gaps = analysis_payload.get("monetisation_gaps") or []
        if any("pricing" in g for g in gaps):
            for s in strategies:
                if s["id"] == "B":
                    s["score"] = round(min(0.95, s["score"] + 0.08), 4)
            strategies = sorted(strategies, key=lambda x: (-x["score"], x["id"]))
            selected = strategies[0]

    sel = next(s for s in strategies if s["id"] == selected["id"])
    return {
        "candidates": strategies,
        "selected": {
            "id": selected["id"],
            "name": selected["name"],
            "score": selected["score"],
            "execution_hooks": sel.get("execution_hooks", []),
        },
        "rationale": "highest_deterministic_score_with_url_mode_pricing_gap_boost",
    }
