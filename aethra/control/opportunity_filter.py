"""Layer 2 — Opportunity filter: hard rejects."""

from __future__ import annotations

from dataclasses import dataclass

from aethra.config import AethraConfig


@dataclass(frozen=True)
class FilterResult:
    pass_filter: bool
    reject_reasons: list[str]
    flags: dict[str, bool]


def run_opportunity_filter(
    *,
    cfg: AethraConfig,
    has_demand_signal: bool,
    has_differentiation: bool,
    margin_pct: float | None,
    launch_days: int | None,
    legal_risk_high: bool,
) -> FilterResult:
    reasons: list[str] = []
    flags: dict[str, bool] = {}

    if not has_demand_signal:
        reasons.append("no_demand_signal")
    if not has_differentiation:
        reasons.append("no_differentiation")
    if margin_pct is None:
        reasons.append("margin_not_established")
        flags["margin_unknown"] = True
    elif margin_pct < cfg.min_viability_margin_pct:
        reasons.append("margin_below_threshold")
    if launch_days is None:
        reasons.append("launch_window_unknown")
        flags["launch_unknown"] = True
    elif launch_days > cfg.max_launch_days:
        reasons.append("cannot_launch_within_14_days")
    if legal_risk_high:
        reasons.append("high_legal_risk")

    return FilterResult(
        pass_filter=len(reasons) == 0,
        reject_reasons=sorted(set(reasons)),
        flags=flags,
    )
