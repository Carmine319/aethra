"""Monetisation Engine — pricing, revenue levers, offer structure."""

from __future__ import annotations

from typing import Any


def run_monetisation(
    mode: str,
    idea_payload: dict[str, Any] | None = None,
    analysis_payload: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ctx = context or {}
    currency = str(ctx.get("currency") or "GBP")

    pricing_strategy = {
        "model": "tiered_subscription_or_usage_aligned_to_value_metric",
        "currency": currency,
        "anchors": ["good_better_best", "annual_default_optional_monthly"],
        "guardrails": ["no_hidden_fees", "clear_refund_window", "uk_eu_consumer_transparency"],
    }

    revenue_improvements: list[str] = []
    if mode == "url" and analysis_payload:
        gaps = analysis_payload.get("monetisation_gaps") or []
        if any("pricing" in g for g in gaps):
            revenue_improvements.append("surface_pricing_or_qualification_path_above_fold")
        conv = analysis_payload.get("conversion_issues") or []
        if conv:
            revenue_improvements.append("strengthen_primary_cta_and_proof_near_cta")

    if mode == "idea":
        revenue_improvements.extend(
            [
                "define_value_metric_and_floor_price_from_unit_economics",
                "add_services_layer_for_high_touch_icp",
            ]
        )

    offer_structure = {
        "core": "single_clear_outcome_promise",
        "upsell": "automation_or_managed_layer",
        "downsell": "lighter_self_serve_tier",
        "bonuses": "onboarding_checkpoint_templates_only_if_substantive",
    }

    ranked = list(revenue_improvements)
    metrics_to_track = [
        "gross_margin_pct",
        "payback_months",
        "trial_to_paid",
        "expansion_revenue",
        "refund_rate",
    ]
    if mode == "url":
        metrics_to_track.extend(["cta_click_through", "scroll_to_pricing_rate"])

    return {
        "pricing_strategy": pricing_strategy,
        "revenue_improvements": sorted(set(revenue_improvements)),
        "revenue_levers_ranked": ranked,
        "offer_structure": offer_structure,
        "metrics_to_track": metrics_to_track,
        "assumptions_disclosed": "requires_verified_cac_ltv_from_your_data",
    }
