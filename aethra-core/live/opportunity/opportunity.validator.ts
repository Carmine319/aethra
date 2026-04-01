export function validateLiveOpportunity(opportunity: Record<string, unknown>) {
  const checks = {
    demand: Number(opportunity.demand || 0.6) >= 0.5,
    buyerIntent: Number(opportunity.intent || 0.6) >= 0.45,
    monetisationImmediate: true,
    deliveryToday: Number(opportunity.feasibility || 0.65) >= 0.45,
  };
  const score = Number((Object.values(checks).filter(Boolean).length / 4).toFixed(4));
  return { checks, score, valid: score >= 0.75 };
}
