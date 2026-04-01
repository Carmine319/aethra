export function validateRevenueFlow(input: { bookedRevenue: number; settledRevenue: number }) {
  const delta = Number((input.bookedRevenue - input.settledRevenue).toFixed(2));
  return {
    valid: Math.abs(delta) <= 1,
    delta,
  };
}
