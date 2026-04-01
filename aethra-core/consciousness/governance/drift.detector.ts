export function detectDrift(input: { goalAlignment: number; capitalEfficiency: number; strategicCoherence: number }) {
  const driftScore = Number((1 - (input.goalAlignment * 0.4 + input.capitalEfficiency * 0.35 + input.strategicCoherence * 0.25)).toFixed(4));
  return {
    driftScore,
    driftDetected: driftScore > 0.45,
  };
}
