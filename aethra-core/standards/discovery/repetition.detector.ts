/**
 * Ω v15 — Surface high-repetition coordination paths (entropy reduction candidates).
 */

export function detectRepetition(classified: { type: string }[]) {
  const counts = new Map<string, number>();
  for (const c of classified) {
    counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([type, count]) => ({ type, count }));
}
