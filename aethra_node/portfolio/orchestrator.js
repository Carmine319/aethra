"use strict";

const { scoreVenture } = require("../scaling/ventureScoring");
const { scalingDecision } = require("../scaling/scalingDecision");

function orchestratePortfolio(ventures) {
  const list = Array.isArray(ventures) ? ventures : [];

  return list.map((v) => {
    const { score, roi } = scoreVenture(v);
    const decision = scalingDecision(v);

    return {
      name: v.name,
      score,
      roi,
      decision: decision.action,
      reason: decision.reason,
    };
  });
}

module.exports = { orchestratePortfolio };
