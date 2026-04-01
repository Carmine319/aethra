export function selectOpportunities(pool: Array<Record<string, unknown>>, limit = 3) {
  return [...pool]
    .sort((a, b) => Number(b.signalStrength || 0) - Number(a.signalStrength || 0))
    .slice(0, Math.max(1, limit));
}
