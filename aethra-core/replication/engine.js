"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));

function replicateWinningPattern(ctx = {}) {
  const patterns = memory.getTopPerformingPatterns();
  const top = patterns[0] || { pattern: "local B2B diagnostic", revenue: 0 };
  const niche = String(ctx.target_niche || `${top.pattern} — adjacent micro-vertical`);
  const clone = {
    id: `replica_${Date.now()}`,
    idea: niche,
    niche,
    status: "building",
    source_pattern: top.pattern,
    offer_channel_pricing_cloned: true,
    deployed_at: Date.now(),
    revenue: 0,
    days_live: 0,
    engagement: 1,
  };
  memory.logVenture(clone);
  memory.logLearning({ type: "replication", clone });
  return clone;
}

module.exports = { replicateWinningPattern };
