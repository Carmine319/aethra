export function mapDislocationToOpportunity(volatility: number, asymmetryLabel: string) {
  const v = Math.max(0, Number(volatility || 0));
  const score =
    asymmetryLabel === "positive-asymmetry" ? v * 1.2 : v * 0.6;
  return { opportunity_score: Math.round(score * 1000) / 1000, window: "dislocation" };
}
