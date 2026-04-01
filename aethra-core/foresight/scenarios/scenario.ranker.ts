export function rankScenarios(scenarios: any[]) {
  return [...(scenarios || [])].sort((a, b) => Number(b.outcome || 0) - Number(a.outcome || 0));
}
