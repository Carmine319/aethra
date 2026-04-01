"use strict";

function shouldKillVenture(v = {}, opts = {}) {
  const days = Number(v.days_live || 0);
  const revenue = Number(v.revenue || 0);
  const engagement = Number(v.engagement || 0);
  const dayThreshold = Number(opts.dayThreshold || 14);
  const minRevenue = Number(opts.minRevenue || 50);
  const minEngagement = Number(opts.minEngagement || 2);

  const kill = days > dayThreshold && revenue < minRevenue && engagement < minEngagement;
  return { kill, reason: kill ? "threshold_breach" : "within_bounds" };
}

module.exports = { shouldKillVenture };