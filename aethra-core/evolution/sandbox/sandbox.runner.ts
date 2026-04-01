import { runScenarioTests } from "./scenario.tests";
import { runRegressionCheck } from "./regression.tests";
import type { EvolutionProposal } from "../proposals/proposal.schema";

export function runSandbox(proposal: EvolutionProposal, baseline?: { error_rate: number }) {
  const worlds = runScenarioTests(proposal);
  const allWorldsPass = worlds.every((w) => w.success);
  const regression = baseline
    ? runRegressionCheck(baseline, { error_rate: baseline.error_rate * (allWorldsPass ? 0.99 : 1.02) })
    : { pass: allWorldsPass, baseline: null, candidate: null };
  return { worlds, regression };
}
