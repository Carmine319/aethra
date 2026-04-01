export function guardIntegrity(input: { riskScore: number; driftScore: number; anomalyScore: number }) {
  const integrityScore = Number((1 - (input.riskScore * 0.4 + input.driftScore * 0.35 + input.anomalyScore * 0.25)).toFixed(4));
  return {
    integrityScore,
    protected: integrityScore >= 0.45,
  };
}
