export function adjustPricing(conversionRate: number, demandSignal: number) {
  const cr = Number(conversionRate || 0);
  const demand = Number(demandSignal || 0);
  if (cr >= 0.06 && demand >= 0.6) return { action: "increase_price", multiplier: 1.08, reason: "high conversion and demand support uplift" };
  if (cr < 0.02) return { action: "reduce_friction", multiplier: 1, reason: "low conversion suggests UX friction, not only pricing" };
  return { action: "hold", multiplier: 1, reason: "stable conversion band" };
}
