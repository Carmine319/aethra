export function measureCapitalEfficiency(input: { revenue: number; spend: number }) {
  return {
    efficiency: input.spend > 0 ? Number((input.revenue / input.spend).toFixed(4)) : 0,
    waste: input.spend > input.revenue ? Number((input.spend - input.revenue).toFixed(2)) : 0,
  };
}
