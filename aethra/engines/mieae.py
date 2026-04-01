"""MIEAE — Macro Intelligence Engine."""

from __future__ import annotations

from typing import Any


def run_mieae(context: dict[str, Any] | None = None) -> dict[str, Any]:
    ctx = context or {}
    macro = ctx.get("macro_signals")
    out = {
        "geopolitical_risk": "unknown_without_feed",
        "economic_conditions": "unknown_without_feed",
        "seasonality": "unknown_without_feed",
        "major_events": [],
        "strategy_adjustment": None,
        "confidence": 0.0,
    }

    if isinstance(macro, dict):
        g = macro.get("geopolitical_risk")
        e = macro.get("economic_conditions")
        s = macro.get("seasonality")
        ev = macro.get("major_events")
        conf = float(macro.get("confidence", 0.0))
        if g:
            out["geopolitical_risk"] = str(g)
        if e:
            out["economic_conditions"] = str(e)
        if s:
            out["seasonality"] = str(s)
        if isinstance(ev, list):
            out["major_events"] = [str(x) for x in ev][:20]
        out["confidence"] = max(0.0, min(1.0, conf))
        if conf >= 0.75 and macro.get("recommended_shift"):
            out["strategy_adjustment"] = str(macro["recommended_shift"])
        else:
            out["strategy_adjustment"] = None

    out["policy"] = "adjust_only_if_confidence_ge_0_75"
    if out["seasonality"] != "unknown_without_feed":
        out["timing_note"] = "Layer seasonal demand into launch windows and inventory or staffing plans."
    else:
        out["timing_note"] = "No seasonality signal supplied; use your category calendar when scheduling."
    return out
