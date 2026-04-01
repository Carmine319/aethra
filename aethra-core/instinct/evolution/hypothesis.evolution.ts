export function evolveHypotheses(history: Array<{ passed: boolean; observedLift: number; hypothesisId: string }>) {
  const winners = history.filter((row) => row.passed);
  const loserCount = history.length - winners.length;
  return {
    evolvedGeneration: Date.now(),
    retainedMotifs: winners.map((row) => row.hypothesisId).slice(0, 5),
    retiredCount: loserCount,
    successRate: Number((winners.length / Math.max(1, history.length)).toFixed(4)),
  };
}
