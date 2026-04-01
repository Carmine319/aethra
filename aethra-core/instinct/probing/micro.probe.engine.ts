import { controlExposure } from "./exposure.controller";

export function runProbe(hypothesis: { id: string; confidence: number; uncertainty: number }, capital: number) {
  const exposure = controlExposure(capital, hypothesis.uncertainty);
  const successProbability = Math.max(0.1, Math.min(0.9, hypothesis.confidence));
  const observedLift = Number(((successProbability - hypothesis.uncertainty * 0.3) * 0.2).toFixed(4));
  return {
    hypothesisId: hypothesis.id,
    spend: exposure.maxProbeSpend,
    successProbability: Number(successProbability.toFixed(4)),
    observedLift,
    passed: observedLift > 0.04,
    exposure,
  };
}

export function runParallelProbes(hypotheses: Array<{ id: string; confidence: number; uncertainty: number }>, capital: number) {
  return hypotheses.slice(0, 6).map((hypothesis) => runProbe(hypothesis, capital));
}
