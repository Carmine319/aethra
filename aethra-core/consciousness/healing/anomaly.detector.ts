export function detectSystemAnomalies(metrics: { performanceDrop: number; errorRate: number; latency: number }) {
  const anomalyScore = Number((Math.max(0, metrics.performanceDrop) * 0.4 + Math.max(0, metrics.errorRate) * 0.4 + Math.max(0, metrics.latency) * 0.2).toFixed(4));
  return {
    anomalyScore,
    needsHealing: anomalyScore >= 0.55,
  };
}
