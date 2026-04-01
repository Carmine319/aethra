"use strict";

function analyseCompetitors(opportunity) {
  const focus = typeof opportunity === "string"
    ? String(opportunity || "service business")
    : String((opportunity && (opportunity.name || opportunity.idea)) || "service business");
  const base = typeof opportunity === "object" && opportunity ? opportunity : { name: focus, idea: focus };
  const improved = {
    ...base,
    name: base.name || focus,
    description: `Improved: ${String(base.description || focus)} with clearer ROI promises and faster onboarding`,
    expectedROI: Number(base.expectedROI || 7.5) + 0.6,
    confidenceScore: Math.min(10, Number(base.confidenceScore || 7) + 0.5),
  };
  return {
    opportunity: focus,
    pricingModels: ["low-ticket entry + upsell", "retainer", "performance-based"],
    acquisitionChannels: ["cold outreach", "content authority", "referrals"],
    positioning: ["speed", "done-for-you delivery", "guaranteed outcomes"],
    weaknesses: ["generic messaging", "slow onboarding"],
    complaints: ["poor communication", "unclear ROI"],
    gaps: ["vertical-specific offers", "transparent weekly reporting"],
    improvedBusinessModel: {
      offer: `${focus} with niche-specific execution sprint`,
      pricing: "Paid diagnostic then retainer with KPI milestones",
      distribution: "Daily outbound + proof-led content",
      differentiation: "Transparent ROI dashboard and 7-day activation",
    },
    improvedOpportunity: improved,
  };
}

module.exports = { analyseCompetitors };
