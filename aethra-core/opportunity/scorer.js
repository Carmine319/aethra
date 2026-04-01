"use strict";

function scoreOpportunity(candidate) {
  const c = candidate || {};
  const roi = Number(c.roiPotential || 7);
  const speed = Number(c.speedToRevenue || 0);
  const difficulty = Number(c.requiredEffort || 0);
  const score = Number((roi * 0.5 + speed * 0.35 - difficulty * 0.15).toFixed(3));
  return { ...c, roiPotential: roi, executionDifficulty: difficulty, score };
}

function selectBestCandidate(candidates) {
  const scored = (Array.isArray(candidates) ? candidates : []).map(scoreOpportunity);
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

module.exports = { scoreOpportunity, selectBestCandidate };
