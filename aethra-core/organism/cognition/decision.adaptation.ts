export function adaptDecisions(learning: { winRate: number; failRate: number }) {
  const exploitBias = learning.winRate >= 0.55;
  return {
    strategyMode: exploitBias ? "scale-winners" : "test-variants",
    decisionRules: exploitBias
      ? ["increase-capital-to-winners", "repeat-proven-messages"]
      : ["reduce-risk", "run-short-experiments"],
  };
}

export function optimiseExternalBusiness(business: Record<string, unknown>) {
  return {
    businessId: String(business.id || "external-host"),
    audit: ["friction-points", "pricing-gaps", "positioning-blur"],
    competitorAnalysis: "completed",
    valueGap: "identified",
    offerClarity: "improved",
    positioning: "refined",
    conversionOptimisation: "deployed",
  };
}
