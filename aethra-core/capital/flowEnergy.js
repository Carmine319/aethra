"use strict";

const path = require("path");
const { readSystemState } = require(path.join(__dirname, "..", "state", "engine.js"));
const memory = require(path.join(__dirname, "..", "memory", "index.js"));

/**
 * Capital as energy: circulate toward high-ROI signals; penalise idle pools.
 */
function flowEnergy(ctx = {}) {
  const state = ctx.state_stub
    ? {
        energy_level: Number(ctx.state_stub.energy_level || 50),
        dominance_score: Number(ctx.state_stub.dominance_score || 50),
      }
    : readSystemState();
  const ventures = memory.readJsonl(memory.FILES.ventures, 400);
  const energy_level = Number(state.energy_level || 50);

  const zones = ventures.map((v) => {
    const roi = Number(v.revenue || 0) / Math.max(1, Number(v.days_live || 1));
    const nutrient = clamp01(roi / 50);
    const toxic = nutrient < 0.15 && Number(v.days_live || 0) > 7;
    return {
      id: v.id || v.idea || "unknown",
      roi_hint: roi,
      nutrient_score: nutrient,
      toxic,
      energy_allocation_pct: toxic ? 0 : Math.round(nutrient * 40 + 10),
    };
  });

  const totalAlloc = zones.reduce((a, z) => a + z.energy_allocation_pct, 0) || 1;
  const normalised = zones.map((z) => ({
    ...z,
    energy_allocation_pct: Math.round((z.energy_allocation_pct / totalAlloc) * 100),
  }));

  const deployed_signal = normalised.reduce((a, z) => a + z.energy_allocation_pct, 0);
  const idle_capital_ratio = clamp01((100 - deployed_signal) / 100);
  const energy_decay_rate = Number((idle_capital_ratio * 0.08).toFixed(4));
  const energy_efficiency_score = Number(
    (state.dominance_score / 100 * (1 - energy_decay_rate)).toFixed(4)
  );

  const flow = {
    ts: Date.now(),
    energy_level,
    zones: normalised,
    idle_capital_ratio,
    energy_decay_rate,
    energy_efficiency_score,
    directive: idle_capital_ratio > 0.35 ? "deploy_or_kill_idle" : "reinforce_nutrient_zones",
    context: ctx,
  };

  if (!ctx.silent) memory.logLearning({ type: "energy_flow", flow });
  return flow;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

module.exports = { flowEnergy };
