export function evaluateFitness(entity: any) {
  const revenue = Number(entity.revenue ?? entity.expectedValue ?? 0);
  const cost = Number(entity.cost ?? entity.capitalImpact ?? 0);
  return revenue - cost;
}
