"""MIGE — Meta Intelligence & Governance Engine (public seven-key contract)."""

from __future__ import annotations

from typing import Any


def _non_empty_section(d: dict[str, Any]) -> bool:
    return bool(d)


def run_mige_public(
    *,
    public: dict[str, Any],
    intent_violations: list[str],
) -> dict[str, Any]:
    sections = (
        "decision",
        "strategy",
        "monetisation",
        "brand",
        "execution",
        "portfolio",
        "delivery",
        "marketing",
        "autonomous",
        "testing",
    )
    present = sum(1 for k in sections if _non_empty_section(public.get(k) or {}))
    completeness = round(present / len(sections), 4)

    drift_flags: list[str] = []
    if intent_violations:
        drift_flags.append("intent_violation_history_in_run")
    dec = public.get("decision") or {}
    if dec.get("proceed") is False:
        drift_flags.append("execution_blocked")

    patterns: list[str] = []
    if dec.get("build_recommended"):
        patterns.append("build_recommended_logged")
    if public.get("strategy"):
        patterns.append("strategy_selected_logged")
    if dec.get("validation"):
        patterns.append("validation_payload_present")

    compliance = {
        "uk_eu_safe_mode": True,
        "checks": [
            "no_fake_suppliers_policy",
            "structured_json_only",
            "no_spam_output_policy",
            "viability_60_pct_floor_enforced",
        ],
    }

    self_score = round(0.55 + 0.12 * completeness + (0.18 if not drift_flags else 0.0), 4)

    return {
        "output_completeness": completeness,
        "self_score": self_score,
        "patterns_extracted": sorted(set(patterns)),
        "compliance": compliance,
        "drift_flags": sorted(set(drift_flags)),
        "correction_actions": sorted(
            set(
                [
                    "review_decision.blocked_reasons",
                    "complete_validation_checklist",
                    "re_run_after_quotes_and_margins",
                ]
            )
        ),
    }
