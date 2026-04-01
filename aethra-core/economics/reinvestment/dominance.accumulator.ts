export function accumulateAdvantage(history: Array<{ roi: number; speed: number; positioning: number }>) {
  const score = history.reduce((sum, row) => sum + Number(row.roi || 0) * 0.4 + Number(row.speed || 0) * 0.3 + Number(row.positioning || 0) * 0.3, 0);
  return {
    dominanceScore: Number((score / Math.max(1, history.length)).toFixed(4)),
    barrierStrength: Number((Math.min(1, score / Math.max(1, history.length))).toFixed(4)),
  };
}
