export function convertOpportunityToRevenue(opportunity: Record<string, unknown>) {
  const intent = Number(opportunity.intent || 0.6);
  const clarity = Number(opportunity.clarity || 0.6);
  const speed = Number(opportunity.speed || 0.6);
  const baseRevenue = Number(opportunity.baseRevenue || 120);
  const revenue = Number((baseRevenue * (0.6 + intent * 0.2 + clarity * 0.1 + speed * 0.1)).toFixed(2));
  return {
    revenue,
    validated: revenue > 0,
    energyGain: revenue,
    efficiency: Number(((intent + clarity + speed) / 3).toFixed(4)),
  };
}
