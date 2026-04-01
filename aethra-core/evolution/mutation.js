"use strict";

const fs = require("fs");
const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));

const MUTATIONS_LOG = path.join(__dirname, "mutations.jsonl");

function appendMutation(row) {
  fs.appendFileSync(MUTATIONS_LOG, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

/**
 * Parallel measurable experiments across pricing, messaging, format, channels, audience.
 */
function mutateSystem(ctx = {}) {
  const base = {
    pricing_variants: [
      { id: "p1", ladder: [19, 49, 99], hypothesis: "entry friction reduction" },
      { id: "p2", ladder: [29, 59, 129], hypothesis: "margin-first ladder" },
    ],
    messaging_variants: [
      { id: "m1", tone: "direct_outcome" },
      { id: "m2", tone: "soft_proof" },
      { id: "m3", tone: "diagnostic_first" },
    ],
    product_formats: ["digital_system", "report_bundle", "automation_plus_call"],
    distribution_channels: ["linkedin", "reddit", "email", "x"],
    audience_targets: ["local_b2b", "solo_operators", "small_teams_5_50"],
  };

  const experiments = [];
  for (let i = 0; i < base.pricing_variants.length; i++) {
    for (let j = 0; j < Math.min(2, base.messaging_variants.length); j++) {
      experiments.push({
        experiment_id: `exp_${i}_${j}`,
        pricing: base.pricing_variants[i],
        messaging: base.messaging_variants[j],
        format: base.product_formats[(i + j) % base.product_formats.length],
        channel: base.distribution_channels[(i + j + 1) % base.distribution_channels.length],
        audience: base.audience_targets[(i + j) % base.audience_targets.length],
        metric: "reply_rate_and_revenue_per_day",
        status: "live_parallel",
      });
    }
  }

  for (const e of experiments) appendMutation({ kind: "mutation_batch", experiment: e });
  memory.logLearning({ type: "mutation_system", parallel_count: experiments.length, context: ctx });

  return { experiments, winning_policy: "promote_top_metric_kill_rest", log_path: MUTATIONS_LOG };
}

module.exports = { mutateSystem, appendMutation };
