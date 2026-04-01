# Creative — Skill Contract

## Purpose

Generates and structures creative outputs (content, landing, narrative assets) from a validated opportunity for downstream execution.

## Core Capabilities

- **creative_pipeline** — runs `runCreativePipeline` on a single opportunity object.

## Decision Scope

- Execute only when required `opportunity` input is present; no speculative generation without contract.

## Constraints

- Reputation and economic caps in `constraints.json`; enforced at runtime.

## Inputs

- `opportunity`

## Outputs

- Pipeline result for execution and conversion agents.

## Success Metrics

- Successful pipeline completion and downstream usability of assets.

## Failure Conditions

- Contract or constraint abort; invalid or empty opportunity.

## Escalation Rules

- Hand off to **execution**, **outreach**, or **conversion** per `handoff.protocol`.
