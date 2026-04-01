export function manageMultiLoops(loops: Array<{ id: string; roi: number; capital: number }>) {
  const winners = loops.filter((loop) => loop.roi >= 2);
  const losers = loops.filter((loop) => loop.roi < 1);
  const neutral = loops.filter((loop) => loop.roi >= 1 && loop.roi < 2);
  return {
    winners,
    losers,
    neutral,
    rebalanceHint: winners.length > losers.length ? "increase-winner-allocation" : "de-risk-portfolio",
  };
}
