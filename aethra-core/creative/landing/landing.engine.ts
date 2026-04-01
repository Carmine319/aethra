export type LandingOffer = Record<string, unknown>;

export type LandingPage = {
  hero: {
    headline: string;
    sub: string;
    cta: string;
  };
  sections: string[];
  pricing: {
    anchor: string;
    main: string;
    upsell: string;
  };
  conversionElements: Array<"scarcity" | "clarity" | "risk reversal">;
};

export function generateLanding(offer: LandingOffer): LandingPage {
  const name = String(offer.name || offer.idea || "Revenue Sprint");
  const audience = String(offer.targetAudience || "operators");
  const outcome = String(offer.outcome || "faster conversions");
  const price = Number(offer.price || 499);

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
