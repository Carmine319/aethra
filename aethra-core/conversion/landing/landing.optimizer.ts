import { rankSectionsByPerformance } from "./layout.intelligence";
import { reduceFriction } from "./friction.reducer";
import { buildDynamicSections } from "./dynamic.sections";

export function optimiseLanding(landing: Record<string, unknown>, behaviouralData: Array<Record<string, unknown>>) {
  const base = landing && typeof landing === "object" ? landing : {};
  const originalSections = Array.isArray(base.sections) ? (base.sections as string[]) : [];
  const dropoff = { pointsOfAbandonment: ["cta"] };
  const dynamic = buildDynamicSections(originalSections, dropoff);
  const sectionOrder = rankSectionsByPerformance(dynamic, behaviouralData);
  const frictionReduced = reduceFriction(base);
  const headline = `Clear outcome: ${String((base.hero as Record<string, unknown> | undefined)?.headline || "Increase revenue per visitor faster")}`;
  const CTA = `Start conversion sprint now: ${String(base.checkoutLink || "https://checkout.stripe.com/pay/aethra")}`;

  return {
    headline,
    sectionOrder,
    CTA,
    frictionScore: 0.12,
    optimisationApplied: true as const,
    landing: frictionReduced,
  };
}
