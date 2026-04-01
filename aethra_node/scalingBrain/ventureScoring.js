"use strict";

/**
 * Weighted venture score from funnel, economics, and velocity (0–100 style inputs on reply/close/velocity; ROI as revenue/cost).
 */
function scoreVenture(venture) {
  const {
    reply_rate = 0,
    close_rate = 0,
    revenue = 0,
    cost = 1,
    velocity = 0,
  } = venture || {};

  const costSafe = Math.max(Number(cost) || 0, 1);
  const roi = Number(revenue) / costSafe;

  const score =
    Number(reply_rate) * 0.2 +
    Number(close_rate) * 0.3 +
    roi * 0.3 +
    Number(velocity) * 0.2;

  return {
    score,
    roi,
  };
}

module.exports = { scoreVenture };
