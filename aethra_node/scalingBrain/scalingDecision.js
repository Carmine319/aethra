"use strict";

const { scoreVenture } = require("./ventureScoring");

function scalingDecision(venture) {
  const { score, roi } = scoreVenture(venture);

  if (score > 70 && roi > 1.5) {
    return { action: "scale", reason: "high performance + strong ROI" };
  }

  if (score > 40) {
    return { action: "maintain", reason: "moderate signals" };
  }

  return { action: "kill", reason: "low performance" };
}

module.exports = { scalingDecision };
