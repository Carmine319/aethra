export function optimiseEnergy(input: { revenue: number; spend: number; manualSteps: number }) {
  const efficiency = input.spend > 0 ? Number((input.revenue / input.spend).toFixed(4)) : 0;
  const waste = Number((Math.max(0, input.manualSteps) * 0.08).toFixed(4));
  return {
    efficiency,
    waste,
    shouldTerminate: input.revenue <= 0 || efficiency < 0.7,
  };
}
