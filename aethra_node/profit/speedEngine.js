"use strict";

function prioritizeSpeedToCash(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const scored = list.map((r) => {
    const days = Number(r.time_to_cash_days || 14);
    const isService = /service|diagnostic|local b2b/i.test(String(r.type || r.niche || ""));
    const active = days <= 7;
    const score = (active ? 70 : 30) + (isService ? 20 : 0) + Math.max(0, 10 - days);
    return {
      ...r,
      time_to_cash_days: days,
      speed_priority: active ? "high" : "deprioritised",
      speed_score: Math.round(score),
    };
  }).sort((a, b) => b.speed_score - a.speed_score);

  return {
    active: scored.filter((r) => r.time_to_cash_days <= 7),
    deprioritised: scored.filter((r) => r.time_to_cash_days > 7),
    ranked: scored,
  };
}

module.exports = { prioritizeSpeedToCash };