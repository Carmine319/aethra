export function mapOutcomes(scenarios: Array<{ hypothesisId: string; upside: number; downside: number; confidence: number }>) {
  return scenarios.map((scenario) => ({
    hypothesisId: scenario.hypothesisId,
    expectedValue: Number((scenario.upside * scenario.confidence - scenario.downside * (1 - scenario.confidence)).toFixed(2)),
    riskBand: scenario.downside > 20 ? "managed-risk" : "low-risk",
  }));
}
