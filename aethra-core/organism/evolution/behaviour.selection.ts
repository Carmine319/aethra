export function selectBehaviour(candidates: Array<{ id: string; score: number }>) {
  const sorted = [...candidates].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  return {
    selected: sorted[0] || { id: "default", score: 0 },
    retained: sorted.slice(0, 3),
  };
}
