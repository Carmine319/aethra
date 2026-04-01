"""PEX — Predictive Execution Engine: simulate reactions, pricing paths."""

from __future__ import annotations

from typing import Any


def run_pex(
    idea_payload: dict[str, Any] | None,
    strategy_selected: dict[str, Any],
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ctx = context or {}
    viability = float((idea_payload or {}).get("viability_score") or 0.5)
    strat_score = float((strategy_selected or {}).get("score") or 0.5)

    base_prob = round(min(0.92, 0.35 + viability * 0.35 + strat_score * 0.22), 4)

    pricing_paths = [
        {"label": "value_metric_monthly", "conversion_lift_estimate": 0.08, "risk": "medium"},
        {"label": "tiered_good_better_best", "conversion_lift_estimate": 0.12, "risk": "low"},
        {"label": "annual_default_with_monthly_escape", "conversion_lift_estimate": 0.05, "risk": "low"},
    ]
    best = sorted(pricing_paths, key=lambda p: (-p["conversion_lift_estimate"], p["label"]))[0]

    objections = ["price", "switching_cost", "trust", "timing"]
    if ctx.get("regulated_vertical"):
        objections.append("compliance_review")

    scenario_matrix = [
        {
            "label": "base_case",
            "reaction_probability": base_prob,
            "pricing_path": best["label"],
            "note": "Assumes clear ICP and honest offer copy.",
        },
        {
            "label": "conservative",
            "reaction_probability": round(max(0.15, base_prob - 0.12), 4),
            "pricing_path": "annual_default_with_monthly_escape",
            "note": "Weaker proof or longer sales cycle.",
        },
        {
            "label": "aggressive_growth",
            "reaction_probability": round(min(0.92, base_prob + 0.06), 4),
            "pricing_path": "tiered_good_better_best",
            "note": "Strong referrals or embedded distribution assumed.",
        },
    ]

    return {
        "estimated_positive_reaction_probability": base_prob,
        "pricing_paths_evaluated": pricing_paths,
        "selected_pricing_path": best,
        "scenario_matrix": scenario_matrix,
        "objections_to_address": sorted(set(objections)),
        "disclaimer": "probabilities_are_structural_estimates_not_market_research",
    }
