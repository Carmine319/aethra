"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "user_plan_state.json");
const MAX_USERS = 5000;

function readState() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!j.users || typeof j.users !== "object") j.users = {};
    return j;
  } catch {
    return { users: {} };
  }
}

function writeState(s) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(s, null, 2), "utf8");
  } catch {
    /* non-fatal */
  }
}

function getUserPlan(userId) {
  const uid = String(userId || "anonymous").slice(0, 120);
  const st = readState();
  const row = st.users[uid];
  const plan = row && row.plan ? String(row.plan) : "free";
  return plan;
}

function setUserPlan(userId, plan) {
  const uid = String(userId || "anonymous").slice(0, 120);
  const p = String(plan || "free").toLowerCase();
  const st = readState();
  if (!st.users[uid]) st.users[uid] = { created_at: Date.now(), plan: "free" };

  st.users[uid].plan = p;
  st.users[uid].updated_at = Date.now();

  const keys = Object.keys(st.users);
  if (keys.length > MAX_USERS) {
    for (const k of keys) {
      if (keys.length <= MAX_USERS) break;
      delete st.users[k];
    }
  }

  writeState(st);
  return p;
}

module.exports = { getUserPlan, setUserPlan, FILE };

