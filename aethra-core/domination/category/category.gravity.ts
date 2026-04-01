import { CategoryDefinition } from "./category.engine";

export function calculateCategoryGravity(definition: CategoryDefinition, adoptionRate: number) {
  const criteriaWeight = Math.min(1, definition.decisionCriteria.length / 6);
  const gravity = Number((Math.max(0, Math.min(1, adoptionRate)) * 0.7 + criteriaWeight * 0.3).toFixed(4));
  return {
    gravity,
    trend: gravity >= 0.65 ? "accelerating" : "forming",
  };
}
