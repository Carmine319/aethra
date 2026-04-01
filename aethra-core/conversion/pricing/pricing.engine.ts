import { buildAnchoredPricing } from "./anchoring.strategy";

export function generatePricing(basePrice: number) {
  const bands = buildAnchoredPricing(basePrice);
  return {
    anchor: bands.anchor,
    core: bands.core,
    decoy: bands.decoy,
    psychologicalPositioning: "Anchor high, convert on core, steer with decoy",
  };
}
