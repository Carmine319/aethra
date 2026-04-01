"use strict";

function generateIdeas(seed) {
  const base = String(seed || "local B2B diagnostic").trim() || "local B2B diagnostic";
  return [
    `${base} - premium diagnostic`,
    `${base} - automation sprint`,
    `${base} - implementation retainer`,
  ];
}

function scoreOpportunity(idea) {
  const text = String(idea || "").toLowerCase();
  const roi = text.includes("premium") ? 9 : text.includes("retainer") ? 8 : 7;
  const speed = text.includes("sprint") ? 9 : 7;
  const friction = text.includes("automation") ? 4 : 5;
  const score = Number((roi * 0.5 + speed * 0.35 - friction * 0.15).toFixed(2));
  return { idea, roi, speed, friction, score };
}

function selectTopCandidate(seed) {
  return generateIdeas(seed).map(scoreOpportunity).sort((a, b) => b.score - a.score)[0];
}

module.exports = { generateIdeas, scoreOpportunity, selectTopCandidate };
