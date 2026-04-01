export function runCapitalFlowLoop(metrics: { revenue: number; spend: number; adoptionRate: number }) {
  const roi = metrics.spend > 0 ? Number((metrics.revenue / metrics.spend).toFixed(4)) : 0;
  const capitalFlowIndex = Number(((roi * 0.6) + (Math.max(0, metrics.adoptionRate) * 0.4)).toFixed(4));
  return {
    capitalFlowIndex,
    roi,
    revenue: Number(metrics.revenue.toFixed(2)),
  };
}
