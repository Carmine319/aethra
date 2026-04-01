"use strict";

const fs = require("fs");
const path = require("path");
const { readSystemState } = require(path.join(__dirname, "..", "state", "engine.js"));

const GOALS_FILE = path.join(__dirname, "current.json");

function refineGoals(ctx = {}) {
  const state = readSystemState();
  let targets = {
    revenue_per_day_gbp: 50,
    leads_per_day: 25,
    reply_rate_pct: 8,
    risk_mode: "balanced",
  };

  if (state.dominance_score > 70 && state.stress_level < 40) {
    targets.revenue_per_day_gbp = 120;
    targets.leads_per_day = 40;
    targets.reply_rate_pct = 10;
    targets.risk_mode = "ambition_up";
  } else if (state.stress_level > 65 || state.energy_level < 25) {
    targets.revenue_per_day_gbp = 25;
    targets.leads_per_day = 15;
    targets.reply_rate_pct = 6;
    targets.risk_mode = "capital_protect";
  }

  const out = { ts: Date.now(), targets, state_snapshot: state, context: ctx };
  try {
    fs.writeFileSync(GOALS_FILE, JSON.stringify(out, null, 2), "utf8");
  } catch {
    /* non-fatal */
  }
  return out;
}

module.exports = { refineGoals, GOALS_FILE };
