export type DecisionCandidate = {
  id: string;
  expectedValue: number;
  riskScore: number;
  capitalImpact: number;
};

export function optimiseDecision(options: DecisionCandidate[], maxRisk = 0.65) {
  const valid = (options || []).filter((o) => Number(o.riskScore ?? 1) <= maxRisk);
  if (!valid.length) throw new Error("No decision passes risk overlay");
  return [...valid].sort((a, b) => Number(b.expectedValue) - Number(a.expectedValue))[0];
}
