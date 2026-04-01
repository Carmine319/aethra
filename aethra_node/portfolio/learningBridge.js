"use strict";

function extractGlobalInsights(ventures) {
  const insights = {
    best_message: {},
    best_price: {},
    best_channel: {},
  };

  const list = Array.isArray(ventures) ? ventures : [];

  list.forEach((v) => {
    const n = String(v.name || "");
    if (!n) return;
    if (v.best_message) insights.best_message[n] = v.best_message;
    if (v.best_price != null && v.best_price !== "") insights.best_price[n] = v.best_price;
    if (v.best_channel) insights.best_channel[n] = v.best_channel;
  });

  return insights;
}

function applyInsights(venture, insights) {
  const ins = insights && typeof insights === "object" ? insights : {};
  const msgVals = Object.values(ins.best_message || {});
  const priceVals = Object.values(ins.best_price || {});

  return {
    ...venture,
    inherited_message: msgVals[0] != null ? msgVals[0] : null,
    inherited_price: priceVals[0] != null ? priceVals[0] : null,
  };
}

module.exports = { extractGlobalInsights, applyInsights };
