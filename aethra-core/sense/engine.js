"use strict";

const fs = require("fs");
const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { summarizePerformance } = require(path.join(__dirname, "..", "metrics", "performance.js"));

const ENV_FILE = path.join(__dirname, "environment_state.json");

function scanEnvironment(ctx = {}) {
  const perf = summarizePerformance();
  const leads = memory.readJsonl(memory.FILES.leads, 200);
  const learn = memory.readJsonl(memory.FILES.learnings, 150);

  const market_signals = {
    demand_proxy: Math.min(100, perf.leads_per_day * 4 + perf.messages_sent * 0.5),
    conversion_pressure: Number(perf.conversion_rate || 0),
    reply_tension: Number(perf.reply_rate || 0),
  };

  const competitor_activity = {
    intensity: 40 + Math.round(Math.sin(Date.now() / 86_400_000) * 15),
    note: "Heuristic pulse — replace with live competitive feed when connected.",
  };

  const trending_topics = [
    "AI-operated micro-SMEs",
    "Diagnostics before build",
    "Zero-cost outbound loops",
  ];

  const lead_behaviour = {
    active_leads_window: leads.filter((l) => Date.now() - Number(l.ts || 0) < 86_400_000).length,
    problem_mix: leads.slice(-20).map((l) => String(l.problem_detected || "").slice(0, 60)),
  };

  const conversion_signals = {
    funnel_health: Number(perf.conversion_rate || 0) > 3 ? "strong" : "weak",
    message_fatigue: Number(perf.reply_rate || 0) < 4,
  };

  const env = {
    ts: Date.now(),
    market_signals,
    competitor_activity,
    trending_topics,
    lead_behaviour,
    conversion_signals,
    context: ctx,
  };

  try {
    fs.writeFileSync(ENV_FILE, JSON.stringify(env, null, 2), "utf8");
  } catch {
    /* non-fatal */
  }

  memory.logMetric({ type: "environment_scan", shift: env.conversion_signals.funnel_health });
  return env;
}

function readEnvironmentState() {
  try {
    return JSON.parse(fs.readFileSync(ENV_FILE, "utf8"));
  } catch {
    return scanEnvironment({});
  }
}

module.exports = { scanEnvironment, readEnvironmentState, ENV_FILE };
