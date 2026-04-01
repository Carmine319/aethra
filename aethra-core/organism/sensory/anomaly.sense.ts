export function senseAnomalies(input: { threatCount: number; inefficiencyCount: number; scoreDrift: number }) {
  const anomalyScore = Number(((input.threatCount * 0.35) + (input.inefficiencyCount * 0.35) + (Math.max(0, input.scoreDrift) * 0.3)).toFixed(4));
  return {
    anomalyScore,
    requiresIntervention: anomalyScore >= 0.9,
    anomalies: [
      input.threatCount > 1 ? "competitive-shock" : "normal-pressure",
      input.inefficiencyCount > 1 ? "energy-leak" : "controlled-efficiency",
    ],
  };
}
