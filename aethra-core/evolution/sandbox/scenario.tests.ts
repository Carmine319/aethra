import { simulateWorlds } from "./simulation.grid";

export function runScenarioTests(proposal: { id: string }) {
  return simulateWorlds(proposal);
}
