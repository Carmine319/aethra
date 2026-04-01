export function prioritiseHypotheses(hypotheses: Array<{ id: string; confidence: number; asymmetryPotential: number; uncertainty: number }>) {
  return [...hypotheses]
    .sort((a, b) => (b.asymmetryPotential * 0.5 + b.confidence * 0.35 - b.uncertainty * 0.15) - (a.asymmetryPotential * 0.5 + a.confidence * 0.35 - a.uncertainty * 0.15))
    .slice(0, 5);
}
