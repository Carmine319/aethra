"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { shouldKillVenture } = require("./engine.js");

function survivalScore(v = {}) {
  const revenue = Number(v.revenue || 0);
  const engagement = Number(v.engagement || 0);
  const days = Number(v.days_live || 0);
  const revTerm = Math.min(40, revenue * 0.8);
  const engTerm = Math.min(35, engagement * 5);
  const timeTerm = Math.max(0, 25 - Math.min(25, days * 1.2));
  return Math.round(revTerm + engTerm + timeTerm);
}

/**
 * Strong replicate, weak die fast, neutral get probe flag.
 */
function applySelectionPressure(opts = {}) {
  const threshold = Number(opts.survival_threshold ?? process.env.CORE_SURVIVAL_THRESHOLD ?? 28);
  const ventures = memory.readJsonl(memory.FILES.ventures, 500);
  const outcomes = { terminated: [], replicated_hint: [], neutral_probe: [] };

  for (const v of ventures) {
    if (!v || v.status === "killed") continue;
    if (v.id === "seed" || v.status === "init") continue;
    const score = survivalScore(v);
    const legacy = shouldKillVenture(v, opts);
    const killNow = score < threshold || legacy.kill;

    if (killNow) {
      memory.logFailure({
        venture_id: v.id,
        reason: "selection_pressure",
        survival_score: score,
        legacy_reason: legacy.reason,
      });
      memory.logVenture({ ...v, status: "killed", survival_score: score, killed_at: Date.now() });
      outcomes.terminated.push({ id: v.id, survival_score: score });
    } else if (score >= 75) {
      outcomes.replicated_hint.push({ id: v.id, survival_score: score, pattern: v.niche || v.idea });
    } else {
      outcomes.neutral_probe.push({ id: v.id, survival_score: score });
    }
  }

  memory.logLearning({ type: "selection_pressure", outcomes });
  return outcomes;
}

module.exports = { applySelectionPressure, survivalScore };
