"use strict";

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x.slice(0, 4))
    .join("");
}

function generateBrand(opportunity) {
  const input = opportunity && typeof opportunity === "object" ? opportunity : {};
  const outcome = String(input.name || input.idea || "Revenue Pilot");
  const targetAudience = String(input.targetAudience || "small teams and solo operators");
  const roi = Number(input.expectedROI || 2.5);
  const nameBase = toSlug(outcome) || "revpilot";
  const name = `Aethra ${nameBase.toUpperCase()} Labs`;
  const promise = `Turn ${outcome.toLowerCase()} into measurable profit in days, not months.`;
  return {
    name,
    positioning: "Outcome-first growth engine that increases revenue and cuts execution time with repeatable automations.",
    tone: "Decisive, proof-led, commercially direct",
    visualStyle: "Clean contrast, conversion-focused layouts, ROI callouts",
    promise,
    targetAudience,
    monetisationAngle: `Productized service plus upsell bundle with ROI-backed pricing aligned to ${roi.toFixed(1)}x targets.`,
    hook: `If ${targetAudience} had a 7-day revenue sprint playbook, how much pipeline would you recover this week?`,
  };
}

module.exports = { generateBrand };
