export function calculateDominanceScore(input: {
  perceptionMetrics: { perceptionIndex: number };
  behaviourMetrics: { behaviourIndex: number };
  revenueMetrics: { roi: number; revenue?: number };
  adoptionMetrics: { adoptionRate: number };
}) {
  const perception = Math.max(0, input.perceptionMetrics.perceptionIndex);
  const behaviour = Math.max(0, input.behaviourMetrics.behaviourIndex);
  const revenue = Math.max(0, input.revenueMetrics.roi / 3);
  const adoption = Math.max(0, input.adoptionMetrics.adoptionRate);
  const dominanceScore = Number(((perception * 0.25) + (behaviour * 0.25) + (revenue * 0.3) + (adoption * 0.2)).toFixed(4));
  return {
    dominanceScore,
    trend: dominanceScore >= 0.65 ? "up" : "forming",
    stability: dominanceScore >= 0.5 ? "stable" : "volatile",
  };
}
