export function selectWinner(results: Array<Record<string, unknown>>) {
  const rows = Array.isArray(results) ? results : [];
  return [...rows].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0] || null;
}
