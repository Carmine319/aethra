import { OpportunityState } from "../registry/opportunity.state";

export function shouldScale(opportunity: OpportunityState) {
  const roiGood = Number(opportunity.roi || 0) >= 2;
  const strongSignal = Number(opportunity.signalStrength || 0) >= 0.65;
  const positiveFeedback = Number(opportunity.conversionRate || 0) >= 0.03;
  return roiGood && strongSignal && positiveFeedback;
}
