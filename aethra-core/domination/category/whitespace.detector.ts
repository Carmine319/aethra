export function detectWhitespace(opportunity: Record<string, unknown>) {
  const competitionDensity = Number(opportunity.competitionDensity || 0.4);
  const buyerClarity = Number(opportunity.buyerClarity || 0.6);
  const whitespaceScore = Number((Math.max(0, 1 - competitionDensity) * buyerClarity).toFixed(4));
  return {
    whitespaceScore,
    preConsensus: whitespaceScore >= 0.35,
    signal: whitespaceScore >= 0.5 ? "high-opportunity" : "developing",
  };
}
