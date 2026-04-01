export function synthesizeHypotheses(weighted: Array<{ id: string; weight: number; gradientHint: number }>) {
  return weighted.map((signal, index) => ({
    id: `hyp_${index}_${signal.id}`,
    thesis: `Exploit ${signal.id} with low-capital offer probe`,
    confidence: Number(Math.max(0.1, Math.min(0.9, signal.weight)).toFixed(4)),
    uncertainty: Number((1 - Math.max(0.1, Math.min(0.9, signal.weight))).toFixed(4)),
    asymmetryPotential: Number((signal.weight * (1 + Math.abs(signal.gradientHint))).toFixed(4)),
  }));
}
