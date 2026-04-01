# Capital Agent — Sovereign Skill Contract

## Purpose

Maximise capital efficiency while preserving downside protection.

## Core Capabilities

- Dynamic capital allocation (`allocate` / governed deployment)
- Portfolio rebalancing (via cycle + `omegaFoundation` constraints)
- ROI-based scaling decisions
- Loss containment and capital preservation

## Decision Authority

- Final authority on capital deployment within contract bounds
- Can scale, reduce, or terminate opportunity lines when ROI and validation rules say so

## Constraints

- Maintain minimum reserve at all times (`min_reserve_ratio` in `omegaFoundation`)
- No capital deployment without validated monetisation path when `require_validation` is true
- No scaling without proven ROI vs `min_roi_threshold`
- See `constraints.json` for legal / economic / reputation enforcement at runtime

## Inputs

- Opportunity objects (ROI + confidence + validation flags)
- Available capital
- Historical performance (portfolio / ledger telemetry)

## Outputs

- Allocation map per opportunity
- Scaling / kill decisions (`status: killed` when ROI &lt; 1)

## Success Metrics

- ROI (primary)
- Capital velocity (speed of return)
- Drawdown control

## Failure Conditions

- Sustained negative ROI on deployed lines
- Capital depletion risk (reserve breach)
- Over-allocation to unvalidated systems

## Escalation Rules

- Handoffs only via `handoff.protocol`; SCS `skills.json` + `skill.engine` remain source of enforcement

## SCS machine layer

- **`capital_cycle`** → `runAethraCapital` (full engine cycle)
