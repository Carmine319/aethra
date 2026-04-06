"use strict";

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const STATE_FILE = path.join(DIR, "portfolio_execution_state.json");
const ARTIFACTS_DIR = path.join(DIR, "artifacts");

const MAX_FEED = 200;
const MAX_BUSINESSES = 80;

function defaultState() {
  return {
    capital_available_gbp: Number(process.env.AETHRA_PORTFOLIO_CAPITAL_GBP) || 5000,
    revenue_today_gbp: 0,
    revenue_today_date: "",
    autonomous_enabled: false,
    last_cycle_ts: 0,
    businesses: [],
    feed: [],
    rev_share: [],
    performance_history: [],
    learning_keywords: {},
    usage: { portfolio_cycles: 0, clinic_reports: 0, deploys: 0 },
  };
}

function ensureArtifactsDir() {
  try {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const j = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...j,
      businesses: Array.isArray(j.businesses) ? j.businesses : [],
      feed: Array.isArray(j.feed) ? j.feed : [],
      rev_share: Array.isArray(j.rev_share) ? j.rev_share : [],
      performance_history: Array.isArray(j.performance_history) ? j.performance_history : [],
      learning_keywords:
        j.learning_keywords && typeof j.learning_keywords === "object" ? j.learning_keywords : {},
      usage: j.usage && typeof j.usage === "object" ? { ...base.usage, ...j.usage } : base.usage,
    };
  } catch {
    return defaultState();
  }
}

function writeState(s) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), "utf8");
  } catch {
    /* keep process alive */
  }
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function bumpRevenueToday(amountGbp) {
  const s = loadState();
  applyRevenueToState(s, amountGbp);
  writeState(s);
}

/** Mutate loaded state in memory (use inside a cycle before saveBusinesses — avoids reload/overwrite races). */
function applyRevenueToState(s, amountGbp) {
  if (!s || typeof s !== "object") return;
  const day = utcDay();
  if (s.revenue_today_date !== day) {
    s.revenue_today_gbp = 0;
    s.revenue_today_date = day;
  }
  s.revenue_today_gbp = Math.round((s.revenue_today_gbp + Number(amountGbp) || 0) * 100) / 100;
}

function pushFeed(s, line, meta) {
  const row = {
    ts: Date.now(),
    text: String(line || "").slice(0, 2000),
    meta: meta && typeof meta === "object" ? meta : {},
  };
  s.feed.unshift(row);
  while (s.feed.length > MAX_FEED) s.feed.pop();
}

function appendPerformance(s, row) {
  s.performance_history.unshift({
    ts: Date.now(),
    ...row,
  });
  while (s.performance_history.length > 120) s.performance_history.pop();
}

function saveBusinesses(s) {
  while (s.businesses.length > MAX_BUSINESSES) s.businesses.pop();
  writeState(s);
}

module.exports = {
  STATE_FILE,
  ARTIFACTS_DIR,
  loadState,
  writeState,
  defaultState,
  ensureArtifactsDir,
  bumpRevenueToday,
  applyRevenueToState,
  pushFeed,
  appendPerformance,
  saveBusinesses,
};
