"use strict";

function normalizePlan(plan) {
  return String(plan || "free").toLowerCase();
}

function canExecute(plan) {
  const p = normalizePlan(plan);
  return p === "operator" || p === "portfolio";
}

function canScale(plan) {
  return normalizePlan(plan) === "portfolio";
}

module.exports = { canExecute, canScale, normalizePlan };

