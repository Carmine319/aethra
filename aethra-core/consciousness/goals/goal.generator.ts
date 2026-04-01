export function generateGoals(input: { capital: number; riskScore: number }) {
  return [
    { id: "preserve-capital", priorityHint: 1, metric: "reserve_ratio", target: 0.35 },
    { id: "compound-growth", priorityHint: 2, metric: "roi_multiple", target: 1.4 },
    { id: "reduce-dependency", priorityHint: 3, metric: "dependency_index", target: 0.4 },
    { id: "resilience-upgrade", priorityHint: input.riskScore > 0.6 ? 1 : 3, metric: "failover_coverage", target: 0.9 },
  ];
}
