# Conversion — Skill Contract

## Purpose

Optimises landing and pricing experiments from real behaviour data; produces measurable conversion outcomes.

## Core Capabilities

- **conversion_loop** — runs `runConversionLoop(landing, data)`.

## Decision Scope

- Operates only on explicit landing + event payloads; no synthetic metrics.

## Constraints

- Monetisation and loss caps per `constraints.json`.

## Inputs

- `landing`, `data`

## Outputs

- Winning variants and telemetry for capital and domination layers.

## Success Metrics

- Measured conversion lift and stable experiment selection.

## Failure Conditions

- Aborted when inputs invalid or constraints fail.

## Escalation Rules

- **capital** or **domination** per `handoff.protocol`.
