export function extractVolatility(series: number[]) {
  const s = series || [];
  if (!s.length) return 0;
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const v = s.reduce((a, x) => a + (x - mean) ** 2, 0) / s.length;
  return Math.sqrt(Math.max(0, v));
}
