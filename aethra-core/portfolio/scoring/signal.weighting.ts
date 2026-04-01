export function weightSignals(signalStrength: number, conversionRate: number) {
  const s = Math.max(0, Math.min(1, Number(signalStrength || 0)));
  const c = Math.max(0, Math.min(1, Number(conversionRate || 0)));
  return Number((s * 0.6 + c * 0.4).toFixed(4));
}
