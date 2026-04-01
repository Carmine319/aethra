/**
 * Ω v15 — Declarative compatibility check between protocol schemas (graceful degradation).
 */

export function assessCompatibility(
  consumer: { fields: Record<string, string> },
  provider: { fields: Record<string, string> }
) {
  const required = Object.keys(consumer.fields);
  const missing = required.filter((k) => provider.fields[k] === undefined);
  return {
    compatible: missing.length === 0,
    missing,
    partialValue: missing.length === 0 ? 1 : Math.max(0, 1 - missing.length / required.length),
  };
}
