"use strict";

const fs = require("fs");
const path = require("path");
const { PLANS, getPlanFeatures, normalizePlan } = require("../saas/billingEngine");
const { loadState, writeState } = require("./stateStore");

const USAGE_FILE = path.join(__dirname, "infra_usage.json");

function readInfraUsage() {
  try {
    return JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
  } catch {
    return { by_user: {} };
  }
}

function writeInfraUsage(j) {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(j, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

/** Subscription tiers + feature flags (wraps existing PLANS). */
function getSubscriptionTiers() {
  return {
    tiers: Object.values(PLANS).map((p) => ({
      id: p.id,
      label: p.label,
      price_gbp_month_low: p.price_gbp_month_low ?? p.price_gbp_month ?? 0,
      price_gbp_month_high: p.price_gbp_month_high ?? p.price_gbp_month ?? 0,
      execution: p.execution === true,
      scaling: p.scaling === true,
      portfolio: p.portfolio,
      runs: p.runs,
      runs_period: p.runs_period,
    })),
    source: "billingEngine.PLANS",
  };
}

/**
 * Usage tracking for portfolio execution actions (per user key).
 */
function trackUsage(userId, action) {
  const key = String(userId || "anonymous").slice(0, 120);
  const act = String(action || "unknown").slice(0, 80);
  const j = readInfraUsage();
  if (!j.by_user || typeof j.by_user !== "object") j.by_user = {};
  const row = j.by_user[key] || { counts: {} };
  row.counts[act] = (Number(row.counts[act]) || 0) + 1;
  row.last_action_at = Date.now();
  j.by_user[key] = row;
  writeInfraUsage(j);

  const st = loadState();
  st.usage = st.usage || {};
  st.usage[`infra_${act}`] = (Number(st.usage[`infra_${act}`]) || 0) + 1;
  writeState(st);

  return { ok: true, user_key: key, action: act, counts: row.counts };
}

/**
 * Access control: portfolio execution requires at least operator when AETHRA_INFRA_STRICT=1.
 * Default: allow (keeps system executable without upgrade friction).
 */
function checkAccess(userId, feature) {
  const { getUserPlan } = require("../billing/planStore");
  const plan = normalizePlan(getUserPlan(userId));
  const f = getPlanFeatures(plan);
  const feat = String(feature || "").toLowerCase();
  const strict = String(process.env.AETHRA_INFRA_STRICT || "").toLowerCase() === "1";

  if (!strict) {
    return { allowed: true, plan, reason: "strict_mode_off" };
  }

  if (feat === "portfolio_execution" || feat === "autonomous_cycle") {
    if (plan === "free") {
      return { allowed: false, plan, upgrade: "operator", reason: "free_blocked_under_strict" };
    }
  }
  if (feat === "full_scaling" && !f.scaling) {
    return { allowed: false, plan, upgrade: "portfolio", reason: "scaling_requires_portfolio" };
  }

  return { allowed: true, plan, features: f };
}

module.exports = {
  getSubscriptionTiers,
  trackUsage,
  checkAccess,
  USAGE_FILE,
};
