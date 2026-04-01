export function validateProbeResults(results: Array<{ hypothesisId: string; passed: boolean; observedLift: number }>) {
  const passed = results.filter((result) => result.passed);
  return {
    passedCount: passed.length,
    failureCount: results.length - passed.length,
    winners: passed.map((result) => result.hypothesisId),
    averageLift: Number((results.reduce((sum, result) => sum + Number(result.observedLift || 0), 0) / Math.max(1, results.length)).toFixed(4)),
  };
}
