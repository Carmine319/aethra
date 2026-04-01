"use strict";

const { analyseDeals, normaliseDealRow } = require("./dealIntelligence");
const { optimiseMessage } = require("./messageOptimiser");
const { optimisePricing } = require("./pricingEngine");
const { computeMetrics } = require("../conversion/conversionDashboard");

/**
 * Niche is "weak" if it has volume but no closes vs. portfolio baseline.
 */
function detectWeakNiche(normalised) {
  const byNiche = {};
  for (const d of normalised) {
    const n = d.niche || "(unknown niche)";
    if (!byNiche[n]) byNiche[n] = { attempts: 0, closes: 0 };
    byNiche[n].attempts++;
    if (d.closed) byNiche[n].closes++;
  }
  const keys = Object.keys(byNiche).filter((k) => k !== "(unknown niche)");
  if (keys.length < 2) return null;

  let worst = null;
  let worstScore = Infinity;
  for (const k of keys) {
    const { attempts, closes } = byNiche[k];
    if (attempts < 2) continue;
    const rate = closes / attempts;
    if (rate === 0 && attempts >= 2 && rate < worstScore) {
      worst = k;
      worstScore = rate;
    }
  }
  return worst;
}

/**
 * Full optimisation pass: intelligence + pricing + rule-based message rewrite.
 */
function runOptimisation(deals, options = {}) {
  const list = Array.isArray(deals) ? deals : [];
  const normalised = list.map((d) => {
    const n = normaliseDealRow(d);
    return { ...n, _normalised: true };
  });

  const insightsFull = analyseDeals(normalised);
  const { messageStats, priceStats, nicheStats, ...insights } = insightsFull;

  const pricing = optimisePricing(normalised);
  const metrics = computeMetrics(list);

  const performance = {
    reply_rate: metrics.reply_rate,
    close_rate: metrics.close_rate,
  };

  const seedMessage =
    options.seed_message != null && String(options.seed_message).trim()
      ? String(options.seed_message).trim()
      : insights.best_message || "operations";

  const optimised_suggested_message = optimiseMessage(seedMessage, performance);
  const weak_niche = detectWeakNiche(normalised);

  const actions = {
    rewrite_message: performance.reply_rate < 10,
    adjust_price: performance.close_rate < 5 && list.length >= 3,
    pivot_niche: Boolean(weak_niche),
  };

  return {
    improvements: {
      message: insights.best_message,
      price: pricing.price != null ? pricing.price : insights.best_price,
      niche: insights.best_niche,
    },
    pricing: {
      optimal_price: pricing.price,
      conversion_rate: pricing.conversion,
      conversion_pct: pricing.conversion_pct,
      attempts: pricing.attempts,
      closes: pricing.closes,
    },
    metrics,
    optimised_suggested_message,
    actions,
    weak_niche,
    stats: { messageStats, priceStats, nicheStats },
  };
}

module.exports = { runOptimisation, detectWeakNiche };
