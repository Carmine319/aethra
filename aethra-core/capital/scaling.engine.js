"use strict";

function scaleOpportunity(opportunity) {
  const op = opportunity && typeof opportunity === "object" ? opportunity : {};
  const roi = Number(op.roiMultiple || op.roi || op.expectedROI || 0);
  if (roi > 2) return { action: "scale", allocationMultiplier: 1.25, kill: false };
  if (roi < 1) return { action: "reduce_or_kill", allocationMultiplier: 0.5, kill: true };
  return { action: "hold_and_optimize", allocationMultiplier: 1.0, kill: false };
}

module.exports = { scaleOpportunity };
