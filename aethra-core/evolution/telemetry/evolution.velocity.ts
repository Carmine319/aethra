export function measureEvolutionVelocity(changes: any[]) {
  return (changes || []).length;
}

export function improvementRate(history: Array<{ leverage_delta?: number; ts?: number }>) {
  if (!history.length) return 0;
  const recent = history.slice(-10);
  const avg = recent.reduce((s, h) => s + Number(h.leverage_delta || 0), 0) / recent.length;
  return Math.round(avg * 1000) / 1000;
}
