"""Public API shape — top-level keys (spec contract)."""

from __future__ import annotations

from typing import Any

from aethra.execution_delivery import attach_execution_delivery_layer
from aethra.operator_autonomous import attach_operator_autonomous_layer, ensure_memory_insight_line

PUBLIC_KEYS = (
    "decision",
    "strategy",
    "monetisation",
    "brand",
    "execution",
    "portfolio",
    "meta",
    "delivery",
    "marketing",
    "autonomous",
    "testing",
)


def ensure_public_shape(d: dict[str, Any]) -> dict[str, Any]:
    out = {k: dict(d.get(k) or {}) for k in PUBLIC_KEYS}
    attach_execution_delivery_layer(out)
    attach_operator_autonomous_layer(out)
    ensure_memory_insight_line(out)
    return out


def scores_0_100(demand: float, differentiation: float, viability: float) -> dict[str, int]:
    return {
        "demand_0_100": int(round(max(0.0, min(1.0, demand)) * 100)),
        "differentiation_0_100": int(round(max(0.0, min(1.0, differentiation)) * 100)),
        "viability_0_100": int(round(max(0.0, min(1.0, viability)) * 100)),
    }


def executive_summary_idea(
    *,
    killed_viability: bool,
    killed_market: bool,
    intent_ok: bool,
    proceed: bool,
    build: bool,
) -> str:
    if not intent_ok:
        return (
            "Intent lock: remove deceptive or non-compliant positioning before any go-to-market work."
        )
    if killed_viability:
        return (
            "Viability sits below the 60% floor. Tighten the wedge, prove unit economics, "
            "and restate demand before allocating capital."
        )
    if killed_market:
        return (
            "Market reality: current framing reads as saturated or under-specified. "
            "Niche down using the scored wedge options, or pause."
        )
    if proceed and build:
        return (
            "Decision: advance. Gates support a disciplined 14-day style launch path: "
            "lock quotes, compliance, and one channel before scaling spend."
        )
    if proceed and not build:
        return (
            "Decision: conditional hold. Signals are mixed; complete the listed validation "
            "items (margin proof, launch window, ICP precision), then re-run."
        )
    return (
        "Decision: hold. Control plane blocked execution; resolve listed blockers before "
        "monetisation or brand spend."
    )


def strategy_narrative(selected: dict[str, Any]) -> str:
    sid = str(selected.get("id", ""))
    name = str(selected.get("name", "")).replace("_", " ")
    if sid == "A":
        return (
            f"Primary play ({sid}): {name} - pick one ICP and one channel, repeat until "
            "repeatable conversion, then expand."
        )
    if sid == "B":
        return (
            f"Primary play ({sid}): {name} - make value metric and packaging obvious; "
            "annual default with a clean downgrade path."
        )
    if sid == "C":
        return (
            f"Primary play ({sid}): {name} - embed into existing workflows; "
            "partners carry distribution risk before broad paid ads."
        )
    return f"Primary play: {name or 'selected strategy'} - execute one motion with measurable KPIs."


def monetisation_thesis(monet: dict[str, Any]) -> str:
    ps = monet.get("pricing_strategy") or {}
    model = str(ps.get("model", "value_based_packaging"))
    return (
        f"Monetisation thesis: {model.replace('_', ' ')} with published guardrails "
        "(no hidden fees, clear refunds) to protect LTV in UK/EU contexts."
    )
