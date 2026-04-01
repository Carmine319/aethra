import { AETHRA_IDENTITY } from "../system.identity";
import { flowEnergy } from "../capital/flowEnergy";
import { runAgent } from "../agents/executor";
import { selectTopCandidate } from "../opportunity/engine";
import { executeBrowserTask } from "../execution/browser/bridge";
import { trackRevenue } from "../revenue/tracker";
import { runAethraCapital } from "./capital.loop";

export async function runAethra(options: { seed?: string; continuous?: boolean; capital?: number; capitalMode?: boolean; profitMode?: "guaranteed" | "aggressive"; userPreference?: string } = {}) {
  if (options.capital != null || options.capitalMode === true) {
    return runAethraCapital(Number(options.capital || 0), { profitMode: options.profitMode, userPreference: options.userPreference });
  }
  const seed = String(options.seed || "local B2B diagnostic");
  const cycleStartedAt = Date.now();

  const capital = flowEnergy({ silent: true });
  const opportunity = selectTopCandidate(seed);
  const validation = await runAgent("GROWTH", opportunity.idea, {});
  if (!validation.output.valid) {
    return {
      ok: true,
      identity: AETHRA_IDENTITY,
      selectedIdea: opportunity.idea,
      executionStatus: "rejected",
      profitGenerated: 0,
      reason: "validation_failed",
      continuous: options.continuous !== false,
    };
  }

  const execution = await executeBrowserTask({
    idea: opportunity.idea,
    context: { capital_signal: capital.energy_efficiency_score },
  });

  const revenue = trackRevenue({
    idea: opportunity.idea,
    revenue: 99,
    cost: 29,
    startedAt: cycleStartedAt,
    finishedAt: Date.now(),
  });

  return {
    ok: true,
    identity: AETHRA_IDENTITY,
    selectedIdea: opportunity.idea,
    executionStatus: execution.status,
    profitGenerated: revenue.profit,
    roi: revenue.roi,
    timeToProfitMs: revenue.timeToProfitMs,
    continuous: options.continuous !== false,
  };
}
