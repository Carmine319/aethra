/**
 * Ω v15 — Collapse noisy traces into latent protocol sketches.
 */

export function inferLatentPatterns(repetitionSummary: { type: string; count: number }[]) {
  return repetitionSummary
    .sort((a, b) => b.count - a.count)
    .map((r) => ({
      latentId: r.type,
      strength: r.count,
      suggestedPrimitive: `coord:${r.type}`,
  }));
}
