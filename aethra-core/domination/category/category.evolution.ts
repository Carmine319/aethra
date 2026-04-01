import { CategoryDefinition } from "./category.engine";

export function evolveCategory(definition: CategoryDefinition, outcomes: Array<Record<string, unknown>>) {
  const outputLift = outcomes.reduce((acc, item) => acc + Number(item.revenueLift || item.outputLift || 0), 0);
  const nextConfidence = Math.max(0, Math.min(1, definition.confidence + (outputLift > 0 ? 0.05 : -0.02)));
  return {
    ...definition,
    confidence: Number(nextConfidence.toFixed(4)),
    decisionCriteria: Array.from(new Set([...definition.decisionCriteria, "repeatability"])),
  };
}
