export function ingestCapital(capital: number) {
  return {
    availableCapital: Number(Math.max(0, capital).toFixed(2)),
    deployable: Number((Math.max(0, capital) * 0.82).toFixed(2)),
  };
}
