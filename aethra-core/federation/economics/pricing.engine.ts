export function priceExchange(base: number, reputationFactor: number) {
  const b = Math.max(0, Number(base || 0));
  const r = Math.max(0.5, Math.min(1.5, Number(reputationFactor || 1)));
  return Math.round(b * r * 100) / 100;
}
