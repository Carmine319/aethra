import { CategoryDefinition } from "./category.engine";

export function lockCategory(category: CategoryDefinition) {
  return {
    locked: true,
    defaultReference: category.category,
    canonicalAnchor: category.narrativeAnchor,
    decisionFramework: category.comparisonFramework,
    lockStrength: Number((category.confidence * 100).toFixed(2)),
  };
}
