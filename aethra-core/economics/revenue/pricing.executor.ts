export function executePricing(basePrice: number, pricingPower: number) {
  const multiplier = Math.max(0.8, Math.min(1.5, 1 + pricingPower * 0.25));
  return {
    finalPrice: Number((basePrice * multiplier).toFixed(2)),
    multiplier: Number(multiplier.toFixed(4)),
  };
}
