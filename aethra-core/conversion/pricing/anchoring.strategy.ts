export function buildAnchoredPricing(basePrice: number) {
  const base = Math.max(1, Number(basePrice || 0));
  return {
    anchor: Number((base * 2.4).toFixed(2)),
    core: Number((base * 1.1).toFixed(2)),
    decoy: Number((base * 1.65).toFixed(2)),
  };
}
