export function scanEnvironment(input: {
  socialSignals: Array<Record<string, unknown>>;
  marketDemand: Array<Record<string, unknown>>;
  competitorBehaviour: Array<Record<string, unknown>>;
  pricingSignals: Array<Record<string, unknown>>;
}) {
  const demandScore = input.marketDemand.reduce((sum, row) => sum + Number(row.score || 0.6), 0) / Math.max(1, input.marketDemand.length);
  const socialHeat = input.socialSignals.reduce((sum, row) => sum + Number(row.engagement || 0.5), 0) / Math.max(1, input.socialSignals.length);
  const priceVolatility = input.pricingSignals.reduce((sum, row) => sum + Number(row.volatility || 0.4), 0) / Math.max(1, input.pricingSignals.length);
  const competitorPressure = input.competitorBehaviour.reduce((sum, row) => sum + Number(row.pressure || 0.5), 0) / Math.max(1, input.competitorBehaviour.length);

  return {
    opportunityZones: demandScore >= 0.6 ? ["high-intent", "under-served"] : ["emerging"],
    threats: competitorPressure >= 0.65 ? ["crowding", "price-pressure"] : ["moderate-competition"],
    inefficiencies: priceVolatility > 0.55 ? ["pricing-friction"] : ["execution-latency"],
    demandShifts: socialHeat >= 0.6 ? ["inbound-increase"] : ["stable-demand"],
    environmentScore: Number(((demandScore * 0.4) + (socialHeat * 0.3) - (competitorPressure * 0.2) - (priceVolatility * 0.1)).toFixed(4)),
  };
}
