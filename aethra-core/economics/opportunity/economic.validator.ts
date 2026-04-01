export function validateEconomicOpportunity(opportunity: Record<string, unknown>) {
  const checks = {
    demand: Number(opportunity.demand || 0.6) >= 0.5,
    valueClarity: Number(opportunity.valueClarity || 0.6) >= 0.45,
    captureMechanism: true,
    deliveryFeasibility: Number(opportunity.feasibility || 0.65) >= 0.45,
    marginPotential: Number(opportunity.marginPotential || 0.6) >= 0.4,
    speedToRevenue: Number(opportunity.speedToRevenue || 0.55) >= 0.4,
    scalability: Number(opportunity.scalability || 0.55) >= 0.4,
    positioningLeverage: Number(opportunity.positioningLeverage || 0.55) >= 0.4,
  };
  const passCount = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    passCount,
    status: passCount >= 8 ? "execute" : passCount >= 5 ? "modify" : "reject",
  };
}
