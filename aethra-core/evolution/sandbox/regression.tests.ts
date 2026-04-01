export function runRegressionCheck(baselineMetrics: { error_rate: number }, candidate: { error_rate: number }) {
  return {
    pass: Number(candidate.error_rate) <= Number(baselineMetrics.error_rate) * 1.05,
    baseline: baselineMetrics.error_rate,
    candidate: candidate.error_rate,
  };
}
