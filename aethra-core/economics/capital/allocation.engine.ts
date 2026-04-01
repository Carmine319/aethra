export function allocateEconomicCapital(capital: number, asymmetryScore: number) {
  const growthBias = Math.max(0.2, Math.min(0.65, 0.35 + asymmetryScore * 0.3));
  const growth = Number((capital * growthBias).toFixed(2));
  const protection = Number((capital * 0.35).toFixed(2));
  const probes = Number((capital - growth - protection).toFixed(2));
  return { growth, protection, probes };
}
