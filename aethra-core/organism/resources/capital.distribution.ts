export function allocateOrganismCapital(totalCapital: number, performance: { winRate: number; failRate: number }) {
  const safe = Number((totalCapital * (performance.failRate > 0.45 ? 0.5 : 0.35)).toFixed(2));
  const growth = Number((totalCapital * (performance.winRate > 0.5 ? 0.45 : 0.35)).toFixed(2));
  const exploration = Number((totalCapital - safe - growth).toFixed(2));
  return {
    safe,
    growth,
    exploration,
  };
}
