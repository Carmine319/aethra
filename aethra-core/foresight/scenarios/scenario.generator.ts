import type { UncertaintyBundle } from "../models/uncertainty.estimator";

export function generateScenarios(point: number, u: UncertaintyBundle) {
  const b = Number(point || 0);
  const spread = u.scenario_spread;
  return [
    { name: "downside", outcome: spread.low, probability: (1 - u.confidence) * 0.5 },
    { name: "base", outcome: spread.mid, probability: u.confidence },
    { name: "upside", outcome: spread.high, probability: (1 - u.confidence) * 0.5 },
  ];
}
