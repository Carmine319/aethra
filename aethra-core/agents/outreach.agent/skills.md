# Outreach — Skill Contract

## Purpose

Runs governed outbound contact batches against validated targets; preserves reputation and economic limits.

## Core Capabilities

- **outreach_dispatch** — executes `runOutreach` with a concrete `targets` array.

## Decision Scope

- Batch membership only within `maxParallelTasks` and spend caps; no policy exceptions.

## Constraints

- No spam, no deception; `maxLossPerTest` enforced per constraints file.

## Inputs

- `targets` — structured list with `id` and `intent` scoring.

## Outputs

- Per-target execution outcome flags for downstream conversion.

## Success Metrics

- Reply rate and zero constraint violations.

## Failure Conditions

- Missing contract inputs, handoff from undefined agent, or spend over cap.

## Escalation Rules

- Pass results to **conversion** or **capital** per `handoff.protocol` only.
