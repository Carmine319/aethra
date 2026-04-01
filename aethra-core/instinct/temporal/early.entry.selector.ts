export function selectEarlyEntries(distribution: Array<{ hypothesisId: string; probability: number }>) {
  return distribution
    .filter((row) => row.probability >= 0.2)
    .sort((a, b) => Number(b.probability || 0) - Number(a.probability || 0))
    .slice(0, 3);
}
