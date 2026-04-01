export function preserveCapital(capital: number, reserveCapital: number) {
  const survivableCapital = Number(Math.max(0, reserveCapital).toFixed(2));
  return {
    survivableCapital,
    spendableCapital: Number(Math.max(0, capital - survivableCapital).toFixed(2)),
    preserved: survivableCapital > 0,
  };
}
