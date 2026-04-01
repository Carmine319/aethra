export function shapeDemand(narrative: { relevance: number; urgency: number; proof: number }) {
  return {
    demandLift: Number((narrative.relevance * 0.4 + narrative.urgency * 0.3 + narrative.proof * 0.3).toFixed(4)),
    mode: "influence-demand",
  };
}
