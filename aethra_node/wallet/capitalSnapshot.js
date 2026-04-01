"use strict";

const wallet = require("../venture/wallet");
const ledger = require("./ledger");

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Unified capital view: operator liquid pool + venture allocations + ledger audit balance.
 */
function getCapitalSnapshot(userId) {
  const uid = String(userId || "anonymous").slice(0, 120);
  const summary = wallet.getWalletSummary();
  const ventures = Array.isArray(summary.ventures) ? summary.ventures : [];
  const active = ventures.filter((v) => !v.archived);

  const liquid = round2(Number(summary.balance) || 0);
  const total = round2(wallet.getTotalBalance());

  const allocated = active
    .filter((v) => Number(v.budget) > 0)
    .map((v) => ({
      label: `${String(v.name || "Venture").slice(0, 48)} (allocated)`,
      amount_gbp: round2(Number(v.budget) || 0),
    }));

  const allocatedTotal = round2(allocated.reduce((s, x) => s + x.amount_gbp, 0));
  const ledgerBalance = round2(ledger.getBalance(uid));

  return {
    user_id: uid,
    available_balance_gbp: liquid,
    total_capital_gbp: total,
    ledger_balance_gbp: ledgerBalance,
    allocated: allocated,
    allocated_total_gbp: allocatedTotal,
    remaining_deployable_gbp: liquid,
    reinvest_pool_gbp: round2(Number(summary.reinvest_pool) || 0),
    notice:
      "Allocation ledger + payment rails (Stripe). Not a bank — funds deploy only when validation signals confirm viability.",
  };
}

module.exports = { getCapitalSnapshot };
