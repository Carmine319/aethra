# Domination — Skill Contract

## Purpose

Computes category, narrative, distribution, and competitive posture from live economic telemetry; feeds reinforcement and governance.

## Core Capabilities

- **domination_loop** — runs `runDominationLoop(opportunity)` with full contract input object.

## Decision Scope

- Strategic pressure adjustments only inside loop outputs; capital deployment remains with capital agent.

## Constraints

- Legal fair-competition posture; economic floors in `constraints.json`.

## Inputs

- `opportunity` — structured domination context (revenue, creative, conversion, portfolio, policy).

## Outputs

- Dominance score, reinforcement plan, locks — auditable by capital loop.

## Success Metrics

- Dominance trend stability and attributed revenue signals.

## Failure Conditions

- Invalid opportunity payload, constraint violation, or aborted validation.

## Escalation Rules

- **capital** or **creative** per `handoff.protocol`.
