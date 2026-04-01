export function maximiseRevenue(priceCandidates: number[], expectedTraffic: number, conversionCurve: Record<number, number>) {
  const prices = Array.isArray(priceCandidates) ? priceCandidates : [];
  const traffic = Math.max(1, Number(expectedTraffic || 1));
  const evaluated = prices.map((price) => {
    const cr = Number(conversionCurve[price] || 0.02);
    return { price, revenue: Number((price * cr * traffic).toFixed(2)), cr };
  });
  const best = evaluated.sort((a, b) => b.revenue - a.revenue)[0] || { price: 0, revenue: 0, cr: 0 };
  return { bestPrice: best.price, projectedRevenue: best.revenue, projectedConversionRate: best.cr };
}
