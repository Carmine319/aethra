export function correctBias(errorRate: number, confidence: number) {
  return {
    biasRisk: errorRate > 0.45 ? "high" : "controlled",
    correctionApplied: errorRate > 0.45 || confidence > 0.85,
    correctionType: errorRate > 0.45 ? "reduce-overfitting" : "maintain-balance",
  };
}
