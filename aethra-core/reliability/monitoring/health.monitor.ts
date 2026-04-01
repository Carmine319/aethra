export function monitorSystem(input: { errorRate: number; executionSuccess: number; latencyMs: number; revenueFlow: number }) {
  const healthScore = Number((1 - input.errorRate * 0.35 + input.executionSuccess * 0.35 - (input.latencyMs / 10000) * 0.15 + input.revenueFlow * 0.15).toFixed(4));
  return {
    healthScore,
    status: healthScore >= 0.6 ? "healthy" : "degraded",
  };
}
