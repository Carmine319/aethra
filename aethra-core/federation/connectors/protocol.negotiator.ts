/** Deterministic compatibility: intersection of capability/protocol sets, hashed score. */
export function negotiateProtocol(local: string[], external: string[]) {
  const L = new Set((local || []).map(String));
  const E = new Set((external || []).map(String));
  let inter = 0;
  for (const x of L) if (E.has(x)) inter += 1;
  const union = Math.max(1, L.size + E.size - inter);
  const compatibilityScore = inter / union;
  return {
    protocol: inter > 0 ? "adaptive" : "none",
    compatibilityScore: Math.round(compatibilityScore * 1000) / 1000,
    shared: [...L].filter((x) => E.has(x)),
  };
}
