"use strict";

const { difficultyToNumber, parseTimeToCashDays } = require("./opportunityEngine");

function scoreOpportunities(opportunities) {
  const list = Array.isArray(opportunities) ? opportunities : [];
  return list.map((o) => {
    const score = Number(o.score) || 0;
    const demand = Number(o.demand) || 0.5;
    const diffN = difficultyToNumber(o.difficulty);
    const days = parseTimeToCashDays(o.time_to_cash);
    const friction = diffN / 3;
    const speed = 1 / Math.max(1, days);
    const comp = String(o.competition_intensity || "").toLowerCase();
    const compPenalty = comp === "high" ? 0.12 : comp === "moderate" ? 0.05 : 0;
    const roiProxy = (score / 100) * (0.5 + demand * 0.5) * (1.15 - friction * 0.35) * (1 + speed * 2);
    const decisionScore = roiProxy * (1 - compPenalty) + speed * 0.25;
    return { opportunity: o, decisionScore, roiProxy, friction, speed };
  });
}

/**
 * Top N distinct opportunities per cycle (spec: max 3 executed per cycle).
 * @param {Array<Record<string, unknown>>} opportunities
 * @param {number} [limit]
 * @returns {Array<Record<string, unknown>>}
 */
function selectTopOpportunities(opportunities, limit = 3) {
  const n = Math.max(1, Math.min(10, Number(limit) || 3));
  const scored = scoreOpportunities(opportunities);
  scored.sort((a, b) => b.decisionScore - a.decisionScore);
  const picked = [];
  const seen = new Set();
  const ts = Date.now();
  for (const row of scored) {
    const idea = String(row.opportunity?.idea || "");
    const key = idea.toLowerCase().slice(0, 80);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push({
      ...row.opportunity,
      _decision: {
        decision_score: Math.round(row.decisionScore * 1000) / 1000,
        roi_proxy: Math.round(row.roiProxy * 1000) / 1000,
        rank_in_cycle: picked.length + 1,
        selected_at: ts,
      },
    });
    if (picked.length >= n) break;
  }
  return picked;
}

/**
 * Select exactly one opportunity (compat — first of top pool).
 * @param {Array<Record<string, unknown>>} opportunities
 * @returns {Record<string, unknown>|null}
 */
function selectOpportunity(opportunities) {
  const top = selectTopOpportunities(opportunities, 1);
  return top[0] || null;
}

module.exports = { selectOpportunity, selectTopOpportunities, scoreOpportunities };
