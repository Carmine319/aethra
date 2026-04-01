import { OpportunityState } from "../registry/opportunity.state";
import { weightSignals } from "./signal.weighting";

export function calculatePerformance(opportunity: OpportunityState) {
  const roi = Number(opportunity.roi || 0);
  const ttr = Math.max(1, Number(opportunity.timeToRevenue || 7));
  const signal = Number(opportunity.signalStrength || 0.5);
  const conversion = Number(opportunity.conversionRate || 0.02);
  const weightedSignal = weightSignals(signal, conversion);
  const performanceScore = Number((roi * 0.45 + (1 / ttr) * 0.2 + weightedSignal * 0.35).toFixed(4));
  const momentum = Number((weightedSignal * Math.max(0, roi)).toFixed(4));
  return { performanceScore, momentum };
}
