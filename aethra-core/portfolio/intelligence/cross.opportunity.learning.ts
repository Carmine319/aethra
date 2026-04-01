import { OpportunityState } from "../registry/opportunity.state";
import { extractProfitPatterns } from "./pattern.extractor";

export function learnAcrossPortfolio(data: OpportunityState[]) {
  const patterns = extractProfitPatterns(data);
  return {
    retainedInsights: [
      `Winner count: ${patterns.winnerCount}`,
      `Dominant signal: ${patterns.dominantSignalBand}`,
      "Replicate high-ROI conversion mechanics across active opportunities",
    ],
    profitRelevantOnly: true,
  };
}
