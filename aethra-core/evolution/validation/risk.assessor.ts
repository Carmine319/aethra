export function assessRisk(proposal: { expectedImpact?: { risk?: number; revenue?: number } }) {
  const r = Number(proposal.expectedImpact?.risk || 0);
  const rev = Number(proposal.expectedImpact?.revenue || 0);
  return { score: r / Math.max(1e-9, rev + 1), raw_risk: r };
}
