"""Layer 4 — Control plane: confidence and execution discipline."""

from __future__ import annotations

from dataclasses import dataclass

from aethra.config import AethraConfig


@dataclass(frozen=True)
class ControlPlaneResult:
    proceed: bool
    blocked_reasons: list[str]
    confidence: float


def run_control_plane(
    *,
    cfg: AethraConfig,
    intent_allowed: bool,
    filter_pass: bool,
    kill_market: bool,
    model_confidence: float,
    viability_below_floor: bool = False,
) -> ControlPlaneResult:
    blocked: list[str] = []
    if not intent_allowed:
        blocked.append("intent_lock_failed")
    if not filter_pass:
        blocked.append("opportunity_filter_failed")
    if kill_market:
        blocked.append("market_killed_saturation")
    if viability_below_floor:
        blocked.append("viability_below_60_pct_floor")
    conf = max(0.0, min(1.0, float(model_confidence)))
    if conf < cfg.control_min_confidence:
        blocked.append("low_confidence")

    return ControlPlaneResult(
        proceed=len(blocked) == 0,
        blocked_reasons=sorted(set(blocked)),
        confidence=conf,
    )
