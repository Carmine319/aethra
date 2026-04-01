"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "index.js"));
const { summarizePerformance } = require(path.join(__dirname, "..", "metrics", "performance.js"));

function deriveInsights() {
  const failures = memory.readJsonl(memory.FILES.failures, 200);
  const learnings = memory.readJsonl(memory.FILES.learnings, 300);
  const perf = summarizePerformance();
  const failureThemes = failures.reduce((acc, f) => {
    const k = String(f.reason || "unknown");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  return {
    perf,
    failure_themes: failureThemes,
    learning_velocity: learnings.filter((l) => Date.now() - Number(l.ts || 0) < 86_400_000).length,
    recommendation_seed: perf.reply_rate < 5 ? "tighten_messaging" : "scale_volume",
  };
}

function predictOutcome(action = {}) {
  const ins = deriveInsights();
  const base = ins.perf.revenue_per_day || 0;
  const uplift =
    String(action.type || "") === "messaging_tune" ? 1.12 : String(action.type || "") === "price_drop" ? 1.08 : 1.03;
  return {
    expected_revenue_day: Number((base * uplift).toFixed(2)),
    confidence: Math.min(0.85, 0.35 + ins.learning_velocity * 0.02),
  };
}

function recommendAction() {
  const ins = deriveInsights();
  if (ins.perf.leads_per_day < 5) return { action: "increase_scrape_depth", reason: "lead_starvation" };
  if (ins.perf.reply_rate < 5) return { action: "rewrite_outreach_parallel", reason: "low_reply" };
  if (ins.perf.revenue_per_day < 10) return { action: "reprice_ladder", reason: "low_revenue" };
  if (ins.perf.conversion_rate < 2) return { action: "shorten_funnel_to_entry_offer", reason: "conversion_drag" };
  return { action: "replicate_top_pattern", reason: "signals_in_band" };
}

module.exports = { deriveInsights, predictOutcome, recommendAction };
