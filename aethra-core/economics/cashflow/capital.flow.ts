export function trackCapitalFlow(input: { openingCapital: number; deployed: number; recovered: number }) {
  const closingCapital = Number((input.openingCapital - input.deployed + input.recovered).toFixed(2));
  return {
    openingCapital: Number(input.openingCapital.toFixed(2)),
    deployed: Number(input.deployed.toFixed(2)),
    recovered: Number(input.recovered.toFixed(2)),
    closingCapital,
  };
}
