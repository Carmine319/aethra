export function repairSystem(state: { anomalyScore: number; dependencyIndex: number }) {
  const isolate = state.anomalyScore > 0.7;
  return {
    isolatedIssue: isolate,
    correctionApplied: true,
    restoredPerformance: Number((Math.max(0.4, 1 - state.anomalyScore * 0.3 + (1 - state.dependencyIndex) * 0.2)).toFixed(4)),
  };
}
