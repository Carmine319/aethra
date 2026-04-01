"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "run_limits_state.json");

function utcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { users: {} };
  }
}

function writeState(s) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(s, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

function getFreeRunStatus(userKey, referrals = 0) {
  const key = String(userKey || "anonymous").slice(0, 120);
  const day = utcDayKey();
  const st = readState();
  if (!st.users || typeof st.users !== "object") st.users = {};
  const row = st.users[key];
  const limit = Number(referrals) >= 3 ? 2 : 1;
  if (!row || row.day !== day) return { used_today: 0, limit, user_key: key };
  return { used_today: Number(row.count) || 0, limit, user_key: key };
}

function assertFreeAnalysisAllowed(userKey, referrals = 0) {
  const { used_today, limit } = getFreeRunStatus(userKey, referrals);
  if (used_today >= limit) {
    const e = new Error(
      limit > 1
        ? "Free tier daily allowance exhausted (including referral bonus). Upgrade to Operator for higher limits."
        : "Free tier allows 1 analysis run per UTC day. Refer 3 peers to unlock a second daily run, or upgrade to Operator."
    );
    e.code = "DAILY_LIMIT";
    throw e;
  }
}

/** Call once after a successful enriched analysis (free tier only). */
function consumeFreeRun(userKey) {
  const key = String(userKey || "anonymous").slice(0, 120);
  const day = utcDayKey();
  const st = readState();
  if (!st.users || typeof st.users !== "object") st.users = {};
  const row = st.users[key] || { day: "", count: 0 };
  if (row.day !== day) {
    row.day = day;
    row.count = 0;
  }
  row.count = (Number(row.count) || 0) + 1;
  st.users[key] = row;
  writeState(st);
}

module.exports = {
  getFreeRunStatus,
  assertFreeAnalysisAllowed,
  consumeFreeRun,
  utcDayKey,
};
