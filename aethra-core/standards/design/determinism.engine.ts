/**
 * Ω v15 — Canonical binding of inputs to schema for deterministic execution.
 */

export function enforceDeterminism(input: any, schema: any) {
  return JSON.stringify({ input, schema });
}
