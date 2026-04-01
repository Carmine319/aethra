/**
 * Ω v15 — Extract recurring structural patterns from raw interaction traces.
 */

export function extractPatterns(traces: Record<string, unknown>[]) {
  return traces.map((t, idx) => ({
    id: `pat-${idx}`,
    signature: typeof t.kind === "string" ? t.kind : "unknown",
    payloadKeys: t && typeof t === "object" ? Object.keys(t) : [],
  }));
}
