export function trackErrors(probeResults: Array<{ hypothesisId: string; passed: boolean; observedLift: number }>) {
  const errors = probeResults
    .filter((result) => !result.passed)
    .map((result) => ({ hypothesisId: result.hypothesisId, errorMagnitude: Number(Math.abs(result.observedLift).toFixed(4)) }));
  return {
    errors,
    errorRate: Number((errors.length / Math.max(1, probeResults.length)).toFixed(4)),
  };
}
