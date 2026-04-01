"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

const CANDIDATES = [
  { niche: "Ice machine cleaning for hospitality", urgency: 90, sales: 88, wtp: 72, competition: 45, fulfilment: 84, reason: "Mandatory hygiene + recurring service window" },
  { niche: "Grease trap maintenance for restaurants", urgency: 87, sales: 85, wtp: 75, competition: 52, fulfilment: 80, reason: "Compliance-driven spend with short decision chain" },
  { niche: "Commercial extraction hood cleaning", urgency: 86, sales: 82, wtp: 78, competition: 58, fulfilment: 72, reason: "Fire-risk prevention budget is already allocated" },
  { niche: "Dental clinic consumables replenishment", urgency: 80, sales: 74, wtp: 81, competition: 62, fulfilment: 69, reason: "Operational continuity spend with predictable reorder cycles" },
  { niche: "Gym equipment sanitisation contracts", urgency: 79, sales: 84, wtp: 70, competition: 55, fulfilment: 83, reason: "Visible hygiene outcomes improve retention and compliance" },
  { niche: "Hotel laundry overflow dispatch", urgency: 75, sales: 77, wtp: 76, competition: 61, fulfilment: 67, reason: "Service continuity risk drives fast procurement" },
  { niche: "Cafe deep-clean reset service", urgency: 82, sales: 86, wtp: 66, competition: 57, fulfilment: 87, reason: "High pain frequency and straightforward operator fulfilment" },
  { niche: "Facilities micro-repairs for retail", urgency: 74, sales: 79, wtp: 73, competition: 63, fulfilment: 74, reason: "Small-ticket urgent fixes approved quickly" },
  { niche: "Office HVAC filter replacement", urgency: 78, sales: 71, wtp: 77, competition: 64, fulfilment: 76, reason: "Air quality and maintenance SLAs force regular spend" },
  { niche: "Food-safe floor restoration", urgency: 81, sales: 80, wtp: 74, competition: 54, fulfilment: 79, reason: "Slip-risk and compliance pressure make budget immediate" }
];

function scoreRow(r) {
  const competitionAdvantage = Math.max(0, 100 - Number(r.competition || 0));
  const weighted =
    Number(r.urgency || 0) * 0.25 +
    Number(r.sales || 0) * 0.2 +
    Number(r.wtp || 0) * 0.2 +
    competitionAdvantage * 0.2 +
    Number(r.fulfilment || 0) * 0.15;
  return Math.round(weighted * 100) / 100;
}

function rankNiches() {
  return CANDIDATES.map((r) => {
    const score = scoreRow(r);
    return {
      niche: r.niche,
      score,
      reason: r.reason,
      urgency_level: score >= 80 ? "critical" : score >= 70 ? "high" : "moderate",
      time_to_cash: score >= 80 ? "3-7 days" : "7-10 days"
    };
  }).sort((a, b) => b.score - a.score);
}

function selectTopNiche(context = {}) {
  const ranked = rankNiches().slice(0, 10);
  const top = ranked[0] || {
    niche: "Hospitality operations support",
    score: 70,
    reason: "Fallback niche",
    urgency_level: "high",
    time_to_cash: "7-10 days"
  };

  appendEconomicMemory({
    kind: "niche_test",
    input: String(context.input || context.idea || "").slice(0, 200),
    selected: top,
    ranked,
  });

  return { selected: top, ranked };
}

module.exports = { rankNiches, selectTopNiche };