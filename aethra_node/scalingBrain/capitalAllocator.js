"use strict";

const { scoreVenture } = require("./ventureScoring");

/**
 * Fund-manager style split: rank by score, cap each slice at 30% of total budget until pool exhausted.
 */
function allocateCapital(ventures, totalBudget) {
  const budget = Math.max(Number(totalBudget) || 0, 0);
  const list = Array.isArray(ventures) ? ventures : [];

  const scored = list.map((v) => ({
    ...v,
    ...scoreVenture(v),
  }));

  const sorted = scored.sort((a, b) => b.score - a.score);

  const allocations = [];
  let remaining = budget;

  for (const v of sorted) {
    if (remaining <= 0) break;

    const allocation = Math.min(remaining, budget * 0.3);

    allocations.push({
      venture: v.name,
      allocated: Math.round(allocation * 100) / 100,
    });

    remaining -= allocation;
  }

  return allocations;
}

module.exports = { allocateCapital };
