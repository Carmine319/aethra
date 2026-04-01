export function scoreOpportunity(opportunity: Record<string, unknown>) {
  const speed = Number(opportunity.speedToRevenue || 0.6);
  const margin = Number(opportunity.marginPotential || 0.6);
  const friction = Number(opportunity.executionFriction || 0.4);
  const scalability = Number(opportunity.scalability || 0.6);
  return Number((speed * 0.35 + margin * 0.3 + (1 - friction) * 0.2 + scalability * 0.15).toFixed(4));
}
