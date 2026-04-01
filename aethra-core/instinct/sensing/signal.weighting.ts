export function weightSignals(fragments: Array<{ fragmentId: string; fragmentStrength: number; gradientHint: number }>) {
  const weighted = fragments.map((fragment) => ({
    id: fragment.fragmentId,
    weight: Number((fragment.fragmentStrength * 0.7 + Math.abs(fragment.gradientHint) * 0.3).toFixed(4)),
    gradientHint: fragment.gradientHint,
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  return { weighted, totalWeight: Number(totalWeight.toFixed(4)) };
}
