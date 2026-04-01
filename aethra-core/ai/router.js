"use strict";

function routeModel(taskType) {
  const t = String(taskType || "bulk").toLowerCase();
  if (t === "strategy") return { lane: "high_reasoning_model" };
  if (t === "execution") return { lane: "fast_model" };
  return { lane: "low_cost_model" };
}

module.exports = { routeModel };