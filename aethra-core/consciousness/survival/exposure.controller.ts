export function controlSurvivalExposure(capital: number, riskScore: number) {
  const deployable = Number((capital * Math.max(0.25, 1 - riskScore * 0.6)).toFixed(2));
  return {
    deployableCapital: deployable,
    constrained: riskScore > 0.65,
  };
}
