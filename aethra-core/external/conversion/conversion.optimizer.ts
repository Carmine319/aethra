export function optimiseConversion(offers: Array<{ id?: string; performance: number }>) {
  const list = [...(offers || [])].filter((x) => Number.isFinite(Number(x.performance)));
  if (!list.length) return null;
  return [...list].sort((a, b) => Number(b.performance) - Number(a.performance))[0];
}
