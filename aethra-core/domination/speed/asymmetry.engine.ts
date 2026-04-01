import { buildTemporalAdvantage } from "./temporal.advantage";

export function createAsymmetry(inputs: { velocity: number; competitorVelocity: number; latencyGain: number }) {
  const temporal = buildTemporalAdvantage(inputs.velocity, inputs.competitorVelocity);
  const asymmetryScore = Number((Math.max(0, temporal.advantage) + Math.max(0, inputs.latencyGain) * 0.5).toFixed(4));
  return {
    asymmetryScore,
    temporal,
    structuralLead: asymmetryScore >= 0.25,
  };
}
