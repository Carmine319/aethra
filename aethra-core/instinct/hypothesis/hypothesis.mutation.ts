export function mutateHypotheses(hypotheses: Array<{ id: string; thesis: string; confidence: number; uncertainty: number; asymmetryPotential: number }>) {
  return hypotheses.flatMap((hypothesis) => ([
    {
      ...hypothesis,
      id: `${hypothesis.id}_mut_a`,
      thesis: `${hypothesis.thesis} via premium positioning`,
      confidence: Number(Math.max(0.05, hypothesis.confidence - 0.05).toFixed(4)),
      uncertainty: Number(Math.min(0.95, hypothesis.uncertainty + 0.05).toFixed(4)),
    },
    {
      ...hypothesis,
      id: `${hypothesis.id}_mut_b`,
      thesis: `${hypothesis.thesis} via low-friction entry offer`,
      asymmetryPotential: Number((hypothesis.asymmetryPotential * 1.08).toFixed(4)),
    },
  ]));
}
