"""IEPE — Industrial Execution & Profit Engine (no fabricated suppliers)."""

from __future__ import annotations

import math
from typing import Any

from aethra.util_json import stable_sort_str_list


def run_iepe(
    idea_payload: dict[str, Any] | None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Real-world execution plan. Suppliers MUST only appear if passed in context
    as verified records; otherwise research_tasks are emitted.
    """
    ctx = context or {}
    slots = (idea_payload or {}).get("slots") or {}
    product = str(slots.get("product_hypothesis", "product")).strip()

    verified = ctx.get("verified_suppliers")
    verified_suppliers: list[dict[str, Any]] = []
    if isinstance(verified, list):
        for row in verified:
            if not isinstance(row, dict):
                continue
            name = str(row.get("name", "")).strip()
            url = str(row.get("url", "")).strip()
            if name and url:
                verified_suppliers.append(
                    {
                        "name": name,
                        "url": url,
                        "notes": str(row.get("notes", "")).strip(),
                    }
                )

    research_tasks = [
        {
            "query": f"Find 3 to 5 vetted manufacturers or wholesalers for: {product[:120]}",
            "constraints": ["request_samples", "confirm_moq", "confirm_incoterms"],
        },
        {
            "query": "Validate HS code / product compliance for UK and EU sale",
            "constraints": ["check_labeling", "check_restricted_categories"],
        },
    ]

    moq = ctx.get("supplier_moq")
    unit_cost = ctx.get("verified_unit_cost")
    sell_price = ctx.get("assumed_sell_price")

    profit_scenarios: list[dict[str, Any]] = []
    if moq is not None and unit_cost is not None and sell_price is not None:
        try:
            m = float(moq)
            uc = float(unit_cost)
            sp = float(sell_price)
            margin_pct = round((sp - uc) / sp * 100, 2) if sp > 0 else 0.0
            contribution = sp - uc
            break_even_units: int | None = None
            if contribution > 0:
                # Units to sell (at sp, after unit cost) to recover cash tied up in one MOQ purchase.
                break_even_units = int(math.ceil((m * uc) / contribution))
            profit_scenarios.append(
                {
                    "label": "single_sku_base_case",
                    "moq": m,
                    "unit_cost": uc,
                    "sell_price": sp,
                    "gross_margin_pct": margin_pct,
                    "break_even_units": break_even_units,
                }
            )
        except (TypeError, ValueError):
            pass

    if not profit_scenarios:
        profit_scenarios.append(
            {
                "label": "unconfigured",
                "note": "Provide supplier_moq, verified_unit_cost, assumed_sell_price for calculations.",
            }
        )

    negotiation_strategy = {
        "objectives": ["reduce_moq", "improve_payment_terms", "secure_rework_policy"],
        "tactics": ["bundle_skus", "commit_to_calendar", "offer_case_study_co_marketing"],
        "non_goals": ["mislead_on_volumes", "ghost_if_terms_unfavorable"],
    }

    fulfilment = {
        "default": "3pl_or_inhouse_only_after_unit_economics_validated",
        "packaging": "compliant_labeling_uk_eu",
        "returns": "clear_policy_published_pre_launch",
    }

    compliance = {
        "uk_eu": ["gpsr_where_applicable", "consumer_rights_transparency", "privacy_gdpr_uk_gdpr"],
        "disclaimer": "not_legal_advice_verify_with_counsel",
    }

    time_to_cash = {
        "estimate_weeks": None,
        "drivers": stable_sort_str_list(["supplier_lead_time", "moq_funding", "channel_payment_terms"]),
        "note": "populate_estimate_weeks_after_supplier_dates_confirmed",
    }

    phases_list = [
        "validate_unit_economics_with_quotes",
        "prototype_or_sample_loop",
        "compliance_pack_and_label_review",
        "soft_launch_to_reference_customers",
        "scale_only_if_margin_floor_sustained",
    ]
    execution_plan = {
        "phases": phases_list,
        "verified_suppliers_count": len(verified_suppliers),
    }

    execution_checklist = [
        "Collect three comparable supplier quotes with MOQ and lead time.",
        "Confirm incoterms, duties, and VAT treatment for UK/EU.",
        "Publish returns and warranty policy before first sale.",
        "Run packaging drop-test and label compliance review.",
    ]

    return {
        "product_focus": product[:200],
        "optimisation_notes": [
            "Reduce part count and packaging cost only if quality floor preserved.",
            "Prefer suppliers with audit trail and invoicing suitable for tax reporting.",
        ],
        "verified_suppliers": verified_suppliers,
        "research_tasks": research_tasks,
        "moq_strategy": "negotiate_down_with_calendar_commitment_or_split_production_runs",
        "true_cost_basis": "requires_verified_quotes_not_estimated_here",
        "profit_scenarios": profit_scenarios,
        "negotiation_strategy": negotiation_strategy,
        "fulfilment": fulfilment,
        "compliance": compliance,
        "time_to_cash": time_to_cash,
        "execution_plan": execution_plan,
        "execution_checklist": execution_checklist,
        "fabrication_policy": "no_unverified_supplier_names_or_urls_invented_by_system",
    }
