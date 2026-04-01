export type DecisionOption = {
  id: string;
  expectedValue: number;
  riskScore: number;
  capitalImpact: number;
  reversible?: boolean;
  payload?: Record<string, unknown>;
};

export function makeDecision(options: DecisionOption[]): DecisionOption {
  const valid = (options || []).filter(
    (o) =>
      o &&
      Number.isFinite(Number(o.expectedValue)) &&
      Number.isFinite(Number(o.riskScore)) &&
      Number.isFinite(Number(o.capitalImpact))
  );
  if (!valid.length) throw new Error("No valid decision options");
  valid.sort((a, b) => Number(b.expectedValue) - Number(a.expectedValue));
  return valid[0];
}
