export function floorExposure(notional: number, floorPct = 0.15) {
  const n = Math.max(0, Number(notional || 0));
  const f = Math.max(0, Math.min(0.5, Number(floorPct)));
  return { max_loss_budget: Math.round(n * f * 100) / 100, notional: n };
}
