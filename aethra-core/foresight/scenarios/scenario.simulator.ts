export function simulateScenarioPath(scenario: { outcome: number; probability: number }, steps = 3) {
  const path: number[] = [];
  let x = Number(scenario.outcome || 0);
  for (let i = 0; i < steps; i++) {
    x *= 1 + scenario.probability * 0.02 * (i - 1);
    path.push(Math.round(x * 1000) / 1000);
  }
  return path;
}
