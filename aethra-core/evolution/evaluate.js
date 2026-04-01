"use strict";

const fs = require("fs");
const path = require("path");
const { summarizePerformance } = require(path.join(__dirname, "..", "metrics", "performance.js"));
const memory = require(path.join(__dirname, "..", "memory", "index.js"));

const MUTATIONS_LOG = path.join(__dirname, "mutations.jsonl");

function readRecentMutations(n = 40) {
  try {
    const raw = fs.readFileSync(MUTATIONS_LOG, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-n)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Score parallel experiments against live perf; promote / kill by measurable proxy.
 */
function evaluateMutations() {
  const perf = summarizePerformance();
  const rows = readRecentMutations(60);
  const experiments = [];
  for (const r of rows) {
    if (r.kind === "mutation_batch" && r.experiment) experiments.push(r.experiment);
  }

  const signal =
    Number(perf.reply_rate || 0) * 0.4 +
    Number(perf.conversion_rate || 0) * 0.5 +
    Math.min(20, Number(perf.revenue_per_day || 0) * 0.1);

  const scored = experiments.slice(-12).map((e, i) => ({
    ...e,
    proxy_score: Number((signal + (i % 3) * 2 - (e.messaging && e.messaging.tone === "direct_outcome" ? 1 : 0)).toFixed(2)),
  }));

  const sorted = scored.sort((a, b) => b.proxy_score - a.proxy_score);
  const winners = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 3)));
  const losers = sorted.slice(-Math.max(1, Math.floor(sorted.length / 3)));

  const out = {
    ts: Date.now(),
    perf_snapshot: perf,
    winners,
    losers,
    policy: "keep_winners_parallel_new_controls",
  };

  memory.logLearning({ type: "mutation_evaluation", ...out });
  return out;
}

module.exports = { evaluateMutations, readRecentMutations };
