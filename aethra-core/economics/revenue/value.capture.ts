export function captureValue(input: { revenue: number; leakageRate: number }) {
  const captured = Number((input.revenue * (1 - Math.max(0, Math.min(0.4, input.leakageRate)))).toFixed(2));
  return {
    captured,
    leakage: Number((input.revenue - captured).toFixed(2)),
  };
}
