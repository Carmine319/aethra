# Instinct — Skill Contract

## Purpose

Pre-cognitive probing under uncertainty: hypotheses, parallel micro-probes, calibration — bounded by capital and constraints.

## Core Capabilities

- **instinct_loop** — runs `runInstinctLoop({ capital, signals })`.

## Decision Scope

- Explore within declared capital and policy; cannot bypass capital agent for deployment.

## Constraints

- Tight `maxLossPerTest` for probes; no deception.

## Inputs

- `capital`, `signals`

## Outputs

- Ranked hypotheses and probe outcomes for organism/capital handoff.

## Success Metrics

- Calibration quality, exploration balance, probe hit rate.

## Failure Conditions

- Missing inputs, constraint breach, or invalid handoff target.

## Escalation Rules

- **capital** or **execution** only, per `handoff.protocol`.
