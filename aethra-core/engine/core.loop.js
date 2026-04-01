"use strict";

const fs = require("fs");
const path = require("path");
const { AETHRA_IDENTITY } = require("../system.identity.js");
const { flowEnergy } = require("../capital/flowEnergy.js");
const { runAgent } = require("../agents/executor.js");
const memory = require("../memory/index.js");
const { selectTopCandidate } = require("../opportunity/engine.js");
const { executeBrowserTask } = require("../execution/browser/bridge.js");
const { trackRevenue } = require("../revenue/tracker.js");
const { runAethraCapital, runCapitalEngine } = require("./capital.loop.js");

const APPEND_ONLY_MEMORY = path.join(__dirname, "..", "..", "aethra_memory", "aethra.actions.jsonl");

function appendMemory(event) {
  const row = JSON.stringify({ ts: Date.now(), ...event }) + "\n";
  fs.mkdirSync(path.dirname(APPEND_ONLY_MEMORY), { recursive: true });
  fs.appendFileSync(APPEND_ONLY_MEMORY, row, "utf8");
}

async function runAethra(options = {}) {
  if (options && (options.capital != null || options.capitalMode === true)) {
    return runAethraCapital(Number(options.capital || 0), {
      ...options,
      profitMode: options.profitMode === "aggressive" ? "aggressive" : "guaranteed",
    });
  }
  const seed = String(options.seed || "local B2B diagnostic");
  const cycleStartedAt = Date.now();

  appendMemory({ kind: "loop_start", seed, identity: AETHRA_IDENTITY.name });
  const capital = flowEnergy({ silent: true });
  appendMemory({ kind: "capital_ingested", signal: capital.energy_efficiency_score });

  const opportunity = selectTopCandidate(seed);
  appendMemory({ kind: "opportunity_selected", idea: opportunity.idea, score: opportunity.score });

  const validation = await runAgent("GROWTH", opportunity.idea, {});
  if (!validation.output.valid) {
    memory.logFailure({ idea: opportunity.idea, reason: "validation_failed" });
    appendMemory({ kind: "validation_failed", idea: opportunity.idea });
    return {
      ok: true,
      identity: AETHRA_IDENTITY,
      selectedIdea: opportunity.idea,
      executionStatus: "rejected",
      profitGenerated: 0,
      continuous: options.continuous !== false,
    };
  }

  const execution = await executeBrowserTask({
    idea: opportunity.idea,
    context: { capital_signal: capital.energy_efficiency_score },
  });
  appendMemory({ kind: "execution_completed", idea: opportunity.idea, status: execution.status });

  const revenue = trackRevenue({
    idea: opportunity.idea,
    revenue: 99,
    cost: 29,
    startedAt: cycleStartedAt,
    finishedAt: Date.now(),
  });
  memory.logRevenue({ venture_id: opportunity.idea, amount: revenue.revenue, currency: "GBP" });
  memory.logLearning({ type: "core_loop_feedback", idea: opportunity.idea, roi: revenue.roi });
  appendMemory({ kind: "profit_tracked", idea: opportunity.idea, profit: revenue.profit, roi: revenue.roi });

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

module.exports = { runAethra };
