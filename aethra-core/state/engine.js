"use strict";

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "system_state.json");
const STATE_HISTORY = path.join(__dirname, "system_state_history.jsonl");

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function computeSystemState(ctx = {}) {
  const memory = require(path.join(__dirname, "..", "memory", "index.js"));
  const { summarizePerformance } = require(path.join(__dirname, "..", "metrics", "performance.js"));

  let energy_level = 50;
  try {
    const { getCapitalSnapshot } = require(path.join(__dirname, "..", "..", "aethra_node", "wallet", "capitalSnapshot.js"));
    const snap = getCapitalSnapshot(String(ctx.user_id || "anonymous"));
    const avail = Number(snap.available_balance_gbp || 0);
    energy_level = clamp(Math.round(avail * 1.2 + 20), 5, 100);
  } catch {
    energy_level = Number(ctx.fallback_energy ?? 50);
  }

  const perf = summarizePerformance();
  const insights = memory.getInsights();
  const revRows = memory.readJsonl(memory.FILES.revenue, 120);
  const failRows = memory.readJsonl(memory.FILES.failures, 120);
  const learnRows = memory.readJsonl(memory.FILES.learnings, 200);

  const recentRev = revRows.filter((r) => Date.now() - Number(r.ts || 0) < 86_400_000 * 3);
  const growth_rate = clamp(
    recentRev.reduce((a, r) => a + Number(r.amount || 0), 0) / 3,
    0,
    100
  );

  const stress_level = clamp(failRows.length * 3 + (100 - Number(perf.reply_rate || 0)) * 0.4, 0, 100);
  const adaptation_rate = clamp(learnRows.filter((l) => Date.now() - Number(l.ts || 0) < 86_400_000).length * 5, 0, 100);

  const dominance_score = clamp(
    Number(perf.reply_rate || 0) * 0.35 + Number(perf.conversion_rate || 0) * 0.45 + growth_rate * 0.2,
    0,
    100
  );

  let energy_decay_rate = 0;
  let energy_efficiency_score = 0;
  try {
    const { flowEnergy } = require(path.join(__dirname, "..", "capital", "flowEnergy.js"));
    const flow = flowEnergy({
      ...ctx,
      silent: true,
      state_stub: { energy_level, dominance_score },
    });
    energy_decay_rate = Number(flow.energy_decay_rate || 0);
    energy_efficiency_score = Number(flow.energy_efficiency_score || 0);
  } catch {
    /* capital module optional */
  }

  const state = {
    ts: Date.now(),
    energy_level,
    growth_rate,
    stress_level,
    adaptation_rate,
    dominance_score,
    energy_decay_rate,
    energy_efficiency_score,
    perf_snapshot: perf,
    portfolio: insights.metrics,
  };

  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    fs.appendFileSync(STATE_HISTORY, JSON.stringify(state) + "\n", "utf8");
  } catch {
    /* non-fatal */
  }

  return state;
}

function readSystemState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return computeSystemState({});
  }
}

module.exports = { computeSystemState, readSystemState, STATE_FILE, STATE_HISTORY };
