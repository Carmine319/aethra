"use strict";

/**
 * Dynamic capital weights by score; allocations capped so the pool never over-deploys.
 */
function rebalancePortfolio(ventures, totalCapital) {
  const cap = Math.max(Number(totalCapital) || 0, 0);
  const sorted = [...(Array.isArray(ventures) ? ventures : [])].sort((a, b) => b.score - a.score);

  let remaining = cap;

  return sorted.map((v) => {
    let raw = 0;

    if (v.score > 70) raw = cap * 0.4;
    else if (v.score > 50) raw = cap * 0.2;
    else raw = 0;

    const allocation = Math.round(Math.min(raw, Math.max(0, remaining)) * 100) / 100;
    remaining -= allocation;

    return {
      name: v.name,
      allocation,
      action: v.score < 40 ? "deallocate" : "fund",
    };
  });
}

module.exports = { rebalancePortfolio };
