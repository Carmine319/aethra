export function createProbabilityDistribution(mapped: Array<{ hypothesisId: string; expectedValue: number }>) {
  const total = mapped.reduce((sum, item) => sum + Math.max(0, item.expectedValue), 0);
  return mapped.map((item) => ({
    hypothesisId: item.hypothesisId,
    probability: total > 0 ? Number((Math.max(0, item.expectedValue) / total).toFixed(4)) : 0,
  }));
}
