"use strict";

const BASE_IDEAS = [
  {
    idea: "Ice machine cleaning service",
    score: 82,
    difficulty: "low",
    time_to_money: "3–5 days",
    reason: "High demand + low competition in commercial hospitality",
  },
  {
    idea: "Specialty cleaning for cafés",
    score: 78,
    difficulty: "low",
    time_to_money: "2–4 days",
    reason: "Clear operational pain point; recurring service wedge",
  },
  {
    idea: "B2B equipment sanitisation contracts",
    score: 76,
    difficulty: "medium",
    time_to_money: "1–2 weeks",
    reason: "Contract stickiness once first site is won",
  },
  {
    idea: "Mobile fleet wash for local trades",
    score: 74,
    difficulty: "low",
    time_to_money: "3–6 days",
    reason: "Asset-light route density in urban corridors",
  },
  {
    idea: "Niche laundry pickup for boutique hotels",
    score: 71,
    difficulty: "medium",
    time_to_money: "1–2 weeks",
    reason: "Operational burden outsourced by small properties",
  },
  {
    idea: "Compliance documentation prep for SMEs",
    score: 79,
    difficulty: "medium",
    time_to_money: "4–7 days",
    reason: "Mandatory spend; sell certainty not creativity",
  },
  {
    idea: "Last-mile refill / consumables for clinics",
    score: 73,
    difficulty: "medium",
    time_to_money: "1–2 weeks",
    reason: "Predictable reorder cycles once onboarded",
  },
  {
    idea: "Seasonal exterior care for retail parks",
    score: 70,
    difficulty: "low",
    time_to_money: "5–10 days",
    reason: "Visible outcome; procurement via facilities managers",
  },
  {
    idea: "Owner-operator bookkeeping hygiene packs",
    score: 77,
    difficulty: "low",
    time_to_money: "2–5 days",
    reason: "Pain is acute at month-end; productise a fixed scope",
  },
  {
    idea: "Micro-fulfilment for local makers",
    score: 75,
    difficulty: "high",
    time_to_money: "2–3 weeks",
    reason: "E-commerce attach; unit economics require tight SLAs",
  },
];

function tokenise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Returns up to 10 ranked venture hypotheses (editorial + signal-style).
 */
function generateIdeas(context) {
  const ctx = context && typeof context === "object" ? context : {};
  const text = String(ctx.text || ctx.idea || "");
  const toks = new Set(tokenise(text));

  const scored = BASE_IDEAS.map((row) => {
    let bump = 0;
    const ideaLower = row.idea.toLowerCase();
    for (const t of toks) {
      if (ideaLower.includes(t) || row.reason.toLowerCase().includes(t)) bump += 3;
    }
    if (/clean|hygiene|wash|café|cafe|hospitality|ice/i.test(text) && /clean|hygiene|café|cafe|ice/i.test(row.idea)) {
      bump += 4;
    }
    return {
      ...row,
      score: Math.min(95, row.score + bump),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}

module.exports = { generateIdeas, BASE_IDEAS };
