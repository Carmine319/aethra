export function buildReinforcementPlan(input: {
  dominanceScore: number;
  trend: string;
  stability: string;
  asymmetryScore: number;
  ubiquityScore: number;
}) {
  const pressure = input.trend === "reversing" || input.stability === "volatile" ? "high" : "normal";
  const reinforceCategory = input.dominanceScore < 0.6;
  const reinforceNarrative = input.ubiquityScore < 1 || input.dominanceScore < 0.65;
  const reinforceSpeed = input.asymmetryScore < 0.3;
  return {
    pressure,
    actions: {
      category: reinforceCategory ? "tighten_decision_criteria" : "maintain_frame",
      narrative: reinforceNarrative ? "increase_repetition" : "maintain_consistency",
      speed: reinforceSpeed ? "reduce_latency_further" : "maintain_velocity",
    },
    reinforcementScore: Number(
      (Number(reinforceCategory) * 0.34 + Number(reinforceNarrative) * 0.33 + Number(reinforceSpeed) * 0.33).toFixed(4)
    ),
  };
}
