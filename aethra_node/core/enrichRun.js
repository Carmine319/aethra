"use strict";

const { runOperatorCycle } = require("./operatorLoop");
const { applyProfitEnforcement } = require("./profitEnforcement");
const { listRecent } = require("../payments/invoice");
const { listPaymentEvents } = require("../memory/learningEngine");
const { normalizePlan, getPlanFeatures } = require("../saas/billingEngine");
const { getUserPlan } = require("../billing/planStore");
const { generateIdeas } = require("../idea/ideaGenerator");
const { formatOutput } = require("./outputFormatter");
const {
  ATTRIBUTION_LINE,
  generateRunId,
  buildViralLayer,
  anonymiseReportPayload,
  saveReport,
} = require("../growth/viralEngine");
const { consumeFreeRun } = require("../saas/runLimiter");
const { runEconomicLoop } = require("../autonomy/economicLoop");

function safeCloneEnvelope(obj) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(obj);
    } catch {
      /* non-cloneable values — fall through */
    }
  }
  try {
    return JSON.parse(
      JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
    );
  } catch {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj && typeof obj === "object" ? { ...obj } : {};
    }
  }
}

/**
 * Merges operator / venture / memory cycle into Python envelope (additive).
 * @param {object} [options]
 * @param {string} [options.plan] — free | operator | portfolio
 * @param {number} [options.referrals]
 * @param {string} [options.user_id]
 */
async function enrichWithOperator(pythonOut, inputText, options = {}) {
  if (!pythonOut || typeof pythonOut !== "object") return pythonOut;
  let bundle;
  try {
    bundle = await runOperatorCycle(pythonOut, String(inputText || ""));
  } catch {
    return pythonOut;
  }

  const userKey = options.user_id || options.userKey || "anonymous";
  const chosenPlan = options.plan || process.env.AETHRA_PLAN || getUserPlan(userKey);
  const plan = normalizePlan(chosenPlan);

  const out = safeCloneEnvelope(pythonOut);
  out.autonomous = { ...(out.autonomous || {}), ...bundle.autonomousPatch };
  out.venture = bundle.venture;
  out.meta = { ...(out.meta || {}) };
  const combinedInsight = [
    ...(bundle.memory_insight_lines || []).filter(Boolean),
  ];
  if (combinedInsight[0] && !out.meta.memory_insight) {
    out.meta.memory_insight = combinedInsight[0];
  }
  out.memory_insight = out.meta.memory_insight || combinedInsight[0] || "";
  out.confidence = out.decision?.confidence_0_100 ?? out.confidence;
  out.meta.operator_cycle = bundle.operator_meta;

  if (bundle.portfolio && typeof bundle.portfolio === "object") {
    out.portfolio = { ...(out.portfolio && typeof out.portfolio === "object" ? out.portfolio : {}), ...bundle.portfolio };
  }
  if (bundle.scaling) out.scaling = bundle.scaling;
  if (bundle.synergy) out.synergy = bundle.synergy;
  if (bundle.wallets_aggregate) out.wallets_aggregate = bundle.wallets_aggregate;
  if (bundle.compounding_intelligence && typeof bundle.compounding_intelligence === "object") {
    out.compounding_intelligence = bundle.compounding_intelligence;
  }

  out.revenue_layer = {
    stripe_mode: process.env.STRIPE_SECRET_KEY ? "key_present" : "simulated",
    invoices: listRecent(10),
    payment_events: listPaymentEvents(8),
  };

  out.ideas_layer = {
    suggestions: generateIdeas({ text: String(inputText || "") }),
  };

  try {
    out.autonomous_economic = await runEconomicLoop(String(inputText || ""), {
      plan,
      user_id: userKey,
    });
  } catch {
    out.autonomous_economic = null;
  }

  const runId = generateRunId();
  out.viral_layer = buildViralLayer(runId, {
    referrals: Number(options.referrals) || 0,
  });

  out.saas_layer = {
    plan,
    features: getPlanFeatures(plan),
    supplier_tier: getPlanFeatures(plan).supplier_insights,
  };

  out.meta.institutional_briefing = formatOutput(
    "Execution posture",
    "Supplier relationships and downstream pathways have been identified and prepared for activation. No manual sourcing pass is required. Execution proceeds immediately upon operator approval under the active plan constraints."
  );
  out.meta.aethra_attribution = ATTRIBUTION_LINE;

  try {
    saveReport(runId, { run_id: runId, ...anonymiseReportPayload(out) });
  } catch {
    /* non-fatal */
  }

  if (plan === "free") {
    try {
      consumeFreeRun(userKey);
    } catch {
      /* non-fatal */
    }
  }

  applyProfitEnforcement(out);

  return out;
}

module.exports = { enrichWithOperator };
