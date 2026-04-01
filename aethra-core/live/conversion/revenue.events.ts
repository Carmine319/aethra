export function buildRevenueEvents(sales: number, price: number) {
  return Array.from({ length: Math.max(0, sales) }).map((_, idx) => ({
    id: `rev_${Date.now()}_${idx}`,
    amount: Number(price.toFixed(2)),
  }));
}
