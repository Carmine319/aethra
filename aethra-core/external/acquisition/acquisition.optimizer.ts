export function optimiseAcquisition(data: Array<{ id?: string; score: number }>) {
  const list = [...(data || [])].filter((x) => Number.isFinite(Number(x.score)));
  if (!list.length) return null;
  return [...list].sort((a, b) => Number(b.score) - Number(a.score))[0];
}
