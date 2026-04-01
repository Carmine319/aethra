export function buildScenarios(hypotheses: Array<{ id: string; confidence: number; uncertainty: number; asymmetryPotential: number }>) {
  return hypotheses.map((hypothesis) => ({
    hypothesisId: hypothesis.id,
    upside: Number((hypothesis.asymmetryPotential * 220).toFixed(2)),
    downside: Number((Math.max(0.05, hypothesis.uncertainty) * 45).toFixed(2)),
    confidence: hypothesis.confidence,
  }));
}
