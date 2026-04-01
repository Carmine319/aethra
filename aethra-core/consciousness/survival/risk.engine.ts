export function evaluateRisk(state: { exposure: number; dependency: number; volatility: number }) {
  const exposure = Number(Math.max(0, Math.min(1, state.exposure || 0.4)).toFixed(4));
  const vulnerability = Number(((Number(state.dependency || 0.4) * 0.55) + (Number(state.volatility || 0.4) * 0.45)).toFixed(4));
  const riskScore = Number((exposure * 0.5 + vulnerability * 0.5).toFixed(4));
  return { exposure, vulnerability, riskScore };
}
