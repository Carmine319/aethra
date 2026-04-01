"use strict";

function generateLanding(offer) {
  const input = offer && typeof offer === "object" ? offer : {};
  const name = String(input.name || input.idea || "Revenue Sprint");
  const audience = String(input.targetAudience || "operators");
  const outcome = String(input.outcome || "faster conversions");
  const price = Number(input.price || 499);
  return {
    hero: {
      headline: `${name}: Convert attention into revenue this week`,
      sub: `For ${audience} who want ${outcome} without bloated funnels or slow implementation.`,
      cta: `Start ${name} now`,
    },
    sections: [
      "pain amplification",
      "cost of inaction",
      "solution mechanism",
      "proof / scenarios",
      "offer breakdown",
      "urgency trigger",
      "CTA",
    ],
    pricing: {
      anchor: `$${Math.max(price * 2, 999)} traditional alternative`,
      main: `$${price} launch offer`,
      upsell: `$${Math.max(Math.round(price * 0.4), 149)} growth accelerator`,
    },
    conversionElements: ["scarcity", "clarity", "risk reversal"],
  };
}

module.exports = { generateLanding };
