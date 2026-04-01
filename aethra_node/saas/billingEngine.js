"use strict";

/**
 * SaaS monetisation — plan features gate execution, scaling, and intelligence depth.
 * Stripe: map Checkout Price IDs in Dashboard to `operator` / `portfolio`; webhook can set tenant plan.
 * See `getStripeHints`, `listPlansForOnboarding`, and server checkout routes.
 */
const PLANS = {
  free: {
    id: "free",
    label: "Free",
    runs: 1,
    runs_period: "day",
    supplier_insights: "limited",
    execution: false,
    portfolio: "none",
    scaling: false,
    full_intelligence: false,
    price_gbp_month: 0,
  },
  operator: {
    id: "operator",
    label: "Operator",
    runs: 10,
    runs_period: "day",
    supplier_insights: "full",
    execution: true,
    portfolio: "limited",
    scaling: false,
    full_intelligence: false,
    price_gbp_month_low: 39,
    price_gbp_month_high: 79,
  },
  portfolio: {
    id: "portfolio",
    label: "Portfolio",
    runs: "unlimited",
    supplier_insights: "full",
    execution: true,
    portfolio: "full",
    scaling: true,
    full_intelligence: true,
    price_gbp_month_low: 149,
    price_gbp_month_high: 299,
  },
};

function normalizePlan(plan) {
  const p = String(plan || "").toLowerCase().trim();
  if (p === "free" || p === "operator" || p === "portfolio") return p;
  const env = String(process.env.AETHRA_PLAN || "").toLowerCase().trim();
  if (env === "free" || env === "operator" || env === "portfolio") return env;
  return "free";
}

function getPlanFeatures(plan) {
  const key = normalizePlan(plan);
  const row = PLANS[key] || PLANS.free;
  return {
    runs: row.runs,
    execution: row.execution === true,
    scaling: row.scaling === true,
    supplier_insights: row.supplier_insights,
    portfolio: row.portfolio,
    full_intelligence: row.full_intelligence === true,
    label: row.label,
  };
}

function assertExecutionAllowed(plan) {
  const f = getPlanFeatures(plan);
  if (!f.execution) {
    const e = new Error("Execution requires an Operator or Portfolio plan. Upgrade to unlock supplier execution, outreach, and CRM.");
    e.code = "UPGRADE_REQUIRED";
    throw e;
  }
}

/** Stripe Checkout hints — map to Dashboard Price IDs in production. */
function getStripeHints(plan) {
  const p = normalizePlan(plan);
  if (p === "operator") {
    return { mode: "subscription", product_type: "subscription", suggested_amount_gbp: 59, plan_key: "operator" };
  }
  if (p === "portfolio") {
    return { mode: "subscription", product_type: "subscription", suggested_amount_gbp: 199, plan_key: "portfolio" };
  }
  return { mode: "none", product_type: "free", plan_key: "free" };
}

function listPlansForOnboarding() {
  return [
    {
      id: "free",
      title: "Free",
      detail: "1 run per day · limited supplier insights · analysis only (no execution)",
      stripe: getStripeHints("free"),
    },
    {
      id: "operator",
      title: "Operator",
      detail: "£39–£79/mo · full execution plan · supplier stack · outreach + CRM · limited portfolio",
      stripe: getStripeHints("operator"),
    },
    {
      id: "portfolio",
      title: "Portfolio",
      detail: "£149–£299/mo · multi-venture orchestration · scaling brain · capital allocation · full intelligence",
      stripe: getStripeHints("portfolio"),
    },
  ];
}

module.exports = {
  PLANS,
  normalizePlan,
  getPlanFeatures,
  assertExecutionAllowed,
  getStripeHints,
  listPlansForOnboarding,
};
