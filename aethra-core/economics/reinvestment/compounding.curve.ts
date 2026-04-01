export function computeCompoundingCurve(history: Array<{ profit: number }>) {
  const total = history.reduce((sum, item) => sum + Number(item.profit || 0), 0);
  const avg = total / Math.max(1, history.length);
  return {
    averageProfit: Number(avg.toFixed(2)),
    compoundingSlope: Number((avg / 100).toFixed(4)),
  };
}
