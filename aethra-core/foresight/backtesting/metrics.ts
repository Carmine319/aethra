export function hitRate(predictions: Array<{ sign_correct: boolean }>) {
  const p = predictions || [];
  if (!p.length) return 0;
  const hits = p.filter((x) => x.sign_correct).length;
  return hits / p.length;
}

export function meanAbsoluteError(series: Array<{ predicted: number; actual: number }>) {
  const s = series || [];
  if (!s.length) return 0;
  return s.reduce((a, x) => a + Math.abs(Number(x.predicted) - Number(x.actual)), 0) / s.length;
}
