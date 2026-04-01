"use strict";

const { normaliseDealRow } = require("./dealIntelligence");

/**
 * Highest empirical conversion price point from historical deal rows.
 */
function optimisePricing(deals) {
  const pricePerformance = {};
  const list = Array.isArray(deals) ? deals : [];

  list.forEach((raw) => {
    const d = raw._normalised ? raw : normaliseDealRow(raw);
    if (d.price == null || d.price === "") return;

    if (!pricePerformance[d.price]) {
      pricePerformance[d.price] = { attempts: 0, closes: 0 };
    }
    pricePerformance[d.price].attempts++;
    if (d.closed) pricePerformance[d.price].closes++;
  });

  const entries = Object.entries(pricePerformance);
  if (!entries.length) {
    return { price: null, conversion: 0, attempts: 0, closes: 0 };
  }

  const ranked = entries
    .map(([price, data]) => ({
      price,
      attempts: data.attempts,
      closes: data.closes,
      conversion: data.attempts ? data.closes / data.attempts : 0,
    }))
    .sort((a, b) => b.conversion - a.conversion);

  const best = ranked[0];
  return {
    price: best.price,
    conversion: best.conversion,
    attempts: best.attempts,
    closes: best.closes,
    conversion_pct: Math.round(best.conversion * 10000) / 100,
  };
}

module.exports = { optimisePricing };
