export function generateOffer(opportunity: Record<string, unknown>) {
  return {
    outcome: String(opportunity.outcome || "faster revenue growth"),
    audience: String(opportunity.targetAudience || "high-intent buyers"),
    price: Number(opportunity.basePrice || 199),
    cta: "Start now",
  };
}
