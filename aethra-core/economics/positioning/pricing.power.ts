export function increasePricingPower(offer: { proofStrength: number; differentiation: number; trust: number }) {
  const power = Number((offer.proofStrength * 0.4 + offer.differentiation * 0.35 + offer.trust * 0.25).toFixed(4));
  return {
    pricingPower: power,
    sensitivityReduction: Number((power * 0.22).toFixed(4)),
  };
}
