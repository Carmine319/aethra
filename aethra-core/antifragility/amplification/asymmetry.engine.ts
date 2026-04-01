export function findAsymmetry(volatility: number, downside: number) {
  const v = Number(volatility || 0);
  const d = Math.max(1e-9, Number(downside || 0));
  return v > d ? "positive-asymmetry" : "neutral";
}
