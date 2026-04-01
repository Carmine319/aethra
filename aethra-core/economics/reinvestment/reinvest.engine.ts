export function reinvestProfit(profit: number, confidence: number) {
  const ratio = Math.max(0.2, Math.min(0.8, 0.35 + confidence * 0.35));
  return {
    reinvestAmount: Number((Math.max(0, profit) * ratio).toFixed(2)),
    reserveAmount: Number((Math.max(0, profit) * (1 - ratio)).toFixed(2)),
  };
}
