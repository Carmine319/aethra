"use strict";

const crypto = require("crypto");

/**
 * Measure performance — blends stored metrics with deterministic simulation from business fingerprint.
 * @param {Record<string, unknown>} business
 * @param {Record<string, unknown>} stateSlice
 */
function measurePerformance(business, stateSlice) {
  const b = business && typeof business === "object" ? business : {};
  const stored = (b.metrics && typeof b.metrics === "object" ? b.metrics : {}) || {};
  const seed = String(b.id || b.opportunity_ref || "x");
  const h = crypto.createHash("sha256").update(seed).digest();
  const r = (i) => h[i % h.length] / 255;

  const baseTraffic = stored.traffic != null ? Number(stored.traffic) : Math.round(80 + r(0) * 420);
  const baseConv = stored.conversion_rate != null ? Number(stored.conversion_rate) : 0.015 + r(1) * 0.04;
  const baseRev = stored.revenue_gbp != null ? Number(stored.revenue_gbp) : Math.round(baseTraffic * baseConv * (29 + r(2) * 120) * 100) / 100;

  const engagement = Math.min(1, 0.25 + r(3) * 0.55 + (Number(builtScore(b)) / 12) * 0.15);
  const signal_strength =
    baseRev > 200 && baseConv > 0.035 ? "strong" : baseRev > 40 && baseConv > 0.02 ? "moderate" : "weak";

  const portfolioContext = stateSlice && typeof stateSlice === "object" ? stateSlice : {};
  const activeCount = Number(portfolioContext.active_businesses) || 1;
  const noise = 1 - Math.min(0.15, activeCount * 0.01);
  const revenue = Math.round(baseRev * noise * 100) / 100;
  const conversion_rate = Math.round(baseConv * noise * 10000) / 10000;

  return {
    revenue,
    conversion_rate,
    signal_strength,
    traffic: baseTraffic,
    engagement,
    measured_at: Date.now(),
  };
}

function builtScore(business) {
  const o = business.opportunity && typeof business.opportunity === "object" ? business.opportunity : null;
  return Number(o?._decision?.decision_score) || Number(o?.score) || 50;
}

module.exports = { measurePerformance };
