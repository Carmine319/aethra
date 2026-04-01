"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

function computeBalancedVolume(input = {}) {
  const base = Math.max(5, Number(input.current_volume || 20));
  const bounce = Math.max(0, Number(input.bounce_rate || 0));
  const reply = Math.max(0, Number(input.reply_rate || 0));

  let target = base;
  let reason = "stable";
  if (bounce > 6) {
    target = Math.max(10, Math.round(base * 0.7));
    reason = "bounce_high_reduce_volume";
  } else if (reply >= 12) {
    target = Math.min(60, Math.round(base * 1.25));
    reason = "reply_strong_increase_volume";
  }

  const out = {
    target_volume: target,
    reason,
    bounce_rate: bounce,
    reply_rate: reply,
  };
  appendEconomicMemory({ kind: "volume_quality_balance", input, out });
  return out;
}

module.exports = { computeBalancedVolume };