"use strict";

const wallet = require("../venture/wallet");
const { getPerformanceSummary } = require("../memory/learningEngine");

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Portfolio stats from ledger only — no invented revenue or success claims.
 */
function getPortfolioStats() {
  const { balance, reinvest_pool, ventures } = wallet.getWalletSummary();
  const all = Array.isArray(ventures) ? ventures : [];
  const active = all.filter((v) => !v.archived);

  const total_revenue = round2(
    all.reduce((s, v) => s + (Number(v.revenue) || 0), 0)
  );
  const budgets_all = round2(all.reduce((s, v) => s + (Number(v.budget) || 0), 0));
  const net_profit = round2(total_revenue - budgets_all);

  const budgets_active = round2(
    active.reduce((s, v) => s + (Number(v.budget) || 0), 0)
  );

  const successful_ventures = all.filter((v) => Number(v.revenue) > 0).length;
  const failed_ventures = all.filter(
    (v) =>
      v.archived && Number(v.revenue) === 0 && Number(v.budget) > 0
  ).length;

  const denom = successful_ventures + failed_ventures;
  let success_rate;
  let success_rate_basis;
  if (denom > 0) {
    success_rate = `${Math.round((successful_ventures / denom) * 100)}%`;
    success_rate_basis = "revenue_positive_ventures_vs_archived_losses";
  } else if (all.length > 0) {
    success_rate = `${Math.round((successful_ventures / all.length) * 100)}%`;
    success_rate_basis = "share_of_all_ventures_with_any_recorded_revenue";
  } else {
    success_rate = "0%";
    success_rate_basis = "no_ventures_in_ledger";
  }

  const total_combined = wallet.getTotalBalance();
  const agg = getPerformanceSummary().aggregates || {};
  const total_stripe_recorded_gbp = round2(agg.total_stripe_gbp || 0);

  return {
    total_wallet: round2(balance),
    total_combined,
    reinvest_pool: round2(reinvest_pool || 0),
    active_ventures: active.length,
    successful_ventures,
    failed_ventures,
    success_rate,
    success_rate_basis,
    total_revenue,
    net_profit,
    total_capital_deployed_gbp: budgets_active,
    transparency_note:
      "Figures are computed from local wallet ledger (GBP). Venture revenue reflects logged/simulated closes; total_stripe_recorded_gbp sums Stripe-tagged payments in the learning ledger — reconcile with Stripe Dashboard and bank.",
  };
}

module.exports = { getPortfolioStats, round2 };
