export function trackConversionMetrics(data: Array<Record<string, unknown>>) {
  const rows = Array.isArray(data) ? data : [];
  const visitors = rows.length || 1;
  const conversions = rows.reduce((a, r) => a + (Number(r.converted || 0) > 0 ? 1 : 0), 0);
  const revenue = rows.reduce((a, r) => a + Number(r.revenue || 0), 0);
  return {
    visitors,
    conversions,
    revenue: Number(revenue.toFixed(2)),
    conversionRate: Number((conversions / visitors).toFixed(4)),
  };
}
