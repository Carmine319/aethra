/**
 * Ω v15 — Entropy-aware coordination analysis (standardisation layer).
 */

export function analyseEntropy(interactions: any[]) {
  return interactions.map((i) => ({
    type: i.type,
    entropy: i.variance * i.decisionPoints,
  }));
}
