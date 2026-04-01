export function analyseFailure(event: { anomalyScore: number; healthScore: number; revenueDelta: number }) {
  const severity = event.anomalyScore > 0.6 || event.healthScore < 0.45 ? "high" : "moderate";
  return {
    rootCause: event.revenueDelta < 0 ? "revenue-reconciliation-gap" : "execution-instability",
    economicImpact: Number(Math.abs(event.revenueDelta).toFixed(2)),
    fixPriority: severity,
  };
}
