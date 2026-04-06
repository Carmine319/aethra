"use strict";

const { loadState, saveBusinesses, pushFeed, applyRevenueToState } = require("./stateStore");

function firstSaleBumpGbp(amountGbp) {
  const fixed = Number(process.env.AETHRA_FIRST_SALE_CAPITAL_BUMP_GBP);
  if (Number.isFinite(fixed) && fixed > 0) {
    return Math.min(5000, Math.round(fixed * 100) / 100);
  }
  const fromSale = Math.round(Number(amountGbp) * 0.25 * 100) / 100;
  return Math.min(500, Math.max(75, fromSale));
}

/**
 * First Stripe sale for a portfolio venture → allocate extra pilot capital (once per venture).
 * @param {{ ventureId: string, amountGbp: number, stripeSessionId?: string|null }} input
 * @returns {{ ok: boolean, reason?: string, already?: boolean, bump_gbp?: number, capital_after_gbp?: number }}
 */
function applyVenturePilotFirstSale(input) {
  const inp = input && typeof input === "object" ? input : {};
  const ventureId = String(inp.ventureId || "").trim();
  const amountGbp = Math.round(Number(inp.amountGbp) * 100) / 100;
  const stripeSessionId = inp.stripeSessionId != null ? String(inp.stripeSessionId).slice(0, 120) : "";

  if (!ventureId) return { ok: false, reason: "no_venture_id" };
  if (!Number.isFinite(amountGbp) || amountGbp <= 0) return { ok: false, reason: "no_amount" };

  const s = loadState();
  const businesses = Array.isArray(s.businesses) ? s.businesses : [];
  const b = businesses.find((x) => x && x.id === ventureId);
  if (!b) return { ok: false, reason: "venture_not_in_portfolio" };
  if (b.status === "killed") return { ok: false, reason: "venture_killed" };
  if (b.stripe_first_sale_applied) {
    return { ok: true, already: true, venture_id: ventureId };
  }

  const bump_gbp = firstSaleBumpGbp(amountGbp);
  s.capital_available_gbp = Math.round(((Number(s.capital_available_gbp) || 0) + bump_gbp) * 100) / 100;
  applyRevenueToState(s, Math.min(500, amountGbp * 0.1));

  b.stripe_first_sale_applied = true;
  b.stripe_first_sale_at = Date.now();
  b.stripe_first_sale_gbp = amountGbp;
  if (stripeSessionId) b.stripe_first_sale_session_id = stripeSessionId;
  b.stripe_first_sale_capital_bump_gbp = bump_gbp;

  pushFeed(
    s,
    `First sale · ${ventureId} · +£${bump_gbp} capital (Stripe pilot).`,
    { type: "stripe_first_sale", venture_id: ventureId, amount_gbp: amountGbp }
  );

  saveBusinesses(s);

  return {
    ok: true,
    venture_id: ventureId,
    bump_gbp,
    capital_after_gbp: s.capital_available_gbp,
    revenue_today_gbp: s.revenue_today_gbp,
  };
}

module.exports = { applyVenturePilotFirstSale, firstSaleBumpGbp };
