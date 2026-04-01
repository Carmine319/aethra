export type CategoryDefinition = {
  category: string;
  narrativeAnchor: string;
  decisionCriteria: string[];
  comparisonFramework: string[];
  confidence: number;
};

export function defineCategory(opportunity: Record<string, unknown>): CategoryDefinition {
  const category = String(opportunity.category || opportunity.market || "Strategic Growth Systems");
  const outcome = String(opportunity.outcome || opportunity.idea || "measurable growth");
  return {
    category,
    narrativeAnchor: `AETHRA is the default system for ${outcome}`,
    decisionCriteria: ["time-to-value", "measurable ROI", "operational simplicity", "capital efficiency"],
    comparisonFramework: ["output velocity", "evidence quality", "behaviour shift", "capital conversion"],
    confidence: 0.72,
  };
}
