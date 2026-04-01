import { OpportunityState } from "../registry/opportunity.state";

export function shouldKill(opportunity: OpportunityState) {
  const noRevenueTooLong = Number(opportunity.revenue || 0) <= 0 && Number(opportunity.age || 0) >= 3;
  const lowROI = Number(opportunity.roi || 0) < 1;
  const decliningSignal = Number(opportunity.signalStrength || 0) < 0.35;
  return noRevenueTooLong || lowROI || decliningSignal;
}
