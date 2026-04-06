"use strict";

const { loadState, writeState, pushFeed } = require("./stateStore");

/**
 * Enable revenue share tracking for a user-attached business.
 * @param {Record<string, unknown>} userBusiness — { user_id, business_id, revenue_gbp?, pct? }
 */
function enableRevShare(userBusiness) {
  const ub = userBusiness && typeof userBusiness === "object" ? userBusiness : {};
  const user_id = String(ub.user_id || ub.userId || "anonymous").slice(0, 120);
  const business_id = String(ub.business_id || ub.businessId || "").slice(0, 120);
  if (!business_id) {
    return { ok: false, error: "missing_business_id" };
  }
  const pct = Math.min(25, Math.max(10, Number(ub.pct) || 15));
  const row = {
    user_id,
    business_id,
    pct,
    revenue_tracked_gbp: Math.max(0, Number(ub.revenue_gbp) || 0),
    aethra_share_gbp: 0,
    enabled_at: Date.now(),
    dashboard: {
      summary: `Rev share ${pct}% on attributed net for ${business_id}`,
      last_sync: Date.now(),
    },
  };
  row.aethra_share_gbp = Math.round(row.revenue_tracked_gbp * (pct / 100) * 100) / 100;

  const s = loadState();
  const idx = s.rev_share.findIndex((r) => r.business_id === business_id && r.user_id === user_id);
  if (idx >= 0) s.rev_share[idx] = { ...s.rev_share[idx], ...row };
  else s.rev_share.unshift(row);
  pushFeed(s, `Rev share enabled: ${pct}% · ${business_id} · user ${user_id}`, { type: "rev_share" });
  writeState(s);

  return { ok: true, rev_share: row, rev_share_list: s.rev_share.slice(0, 30) };
}

/**
 * Apply revenue attribution and update AETHRA share.
 */
function trackRevShareRevenue(businessId, userId, revenueGbp) {
  const s = loadState();
  const bid = String(businessId || "");
  const uid = String(userId || "anonymous");
  const row = s.rev_share.find((r) => r.business_id === bid && r.user_id === uid);
  if (!row) return { ok: false, error: "not_found" };
  const add = Math.max(0, Number(revenueGbp) || 0);
  row.revenue_tracked_gbp = Math.round((row.revenue_tracked_gbp + add) * 100) / 100;
  row.aethra_share_gbp = Math.round(row.revenue_tracked_gbp * (row.pct / 100) * 100) / 100;
  row.dashboard = { ...row.dashboard, last_sync: Date.now() };
  writeState(s);
  return { ok: true, rev_share: row };
}

module.exports = { enableRevShare, trackRevShareRevenue };
