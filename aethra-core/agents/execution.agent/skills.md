# Execution — Skill Contract

## Purpose

Runs browser-scoped execution tasks with explicit payloads; bridges creative and live delivery without undefined behaviour.

## Core Capabilities

- **browser_task** — calls `executeBrowserTask` with a structured `task` object.

## Decision Scope

- Execute declared steps only; escalate tasks that violate constraints instead of improvising.

## Constraints

- Spend, retries, and reputation limits in `constraints.json`.

## Inputs

- `task` — idea, optional actions and context.

## Outputs

- Deterministic execution receipt for auditing.

## Success Metrics

- `ok` completions with acceptable latency.

## Failure Conditions

- Aborted runs when inputs or constraints fail validation.

## Escalation Rules

- **outreach**, **conversion**, or **capital** per `handoff.protocol`.
