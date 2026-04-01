export type BrandOpportunity = Record<string, unknown>;

export type BrandProfile = {
  name: string;
  positioning: string;
  tone: string;
  visualStyle: string;
  promise: string;
  targetAudience: string;
  monetisationAngle: string;
  hook: string;
};

function toSlug(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x.slice(0, 4))
    .join("");
}

export function generateBrand(opportunity: BrandOpportunity): BrandProfile {
  const outcome = String(opportunity.name || opportunity.idea || "Revenue Pilot");
  const targetAudience = String(opportunity.targetAudience || "small teams and solo operators");
  const roi = Number(opportunity.expectedROI || 2.5);
  const nameBase = toSlug(outcome) || "revpilot";
  const name = `Aethra ${nameBase.toUpperCase()} Labs`;
  const promise = `Turn ${outcome.toLowerCase()} into measurable profit in days, not months.`;

  return {
    name,
    positioning: `Outcome-first growth engine that increases revenue and cuts execution time with repeatable automations.`,
    tone: "Decisive, proof-led, commercially direct",
    visualStyle: "Clean contrast, conversion-focused layouts, ROI callouts",
    promise,
    targetAudience,
    monetisationAngle: `Productized service plus upsell bundle with ROI-backed pricing aligned to ${roi.toFixed(1)}x targets.`,
    hook: `If ${targetAudience} had a 7-day revenue sprint playbook, how much pipeline would you recover this week?`,
  };
}
