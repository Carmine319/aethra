/**
 * Ω v15 — Normalise and classify interaction records for downstream detection.
 */

export function analyseInteractions(events: Record<string, unknown>[]) {
  return events.map((e) => ({
    type: e.type ?? "unspecified",
    participants: ([] as string[]).concat((e.participants as string[]) || []),
    costHint: typeof e.costHint === "number" ? e.costHint : 0,
  }));
}
