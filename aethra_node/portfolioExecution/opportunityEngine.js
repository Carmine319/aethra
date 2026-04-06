"use strict";

const { generateIdeas } = require("../idea/ideaGenerator");

const REDDIT_SUBS = ["Entrepreneur", "smallbusiness", "SaaS", "ecommerce", "CustomerService"];
const TIKTOK_STYLE_SEEDS = [
  { product: "desk cable management kit", wave: "home office", demand: 0.72 },
  { product: "portable cold plunge timer app", wave: "recovery", demand: 0.68 },
  { product: "AI invoice dispute letter pack", wave: "SMB finance", demand: 0.81 },
  { product: "micro-SaaS churn email sequences", wave: "retention", demand: 0.77 },
];

const AMAZON_PAIN_TERMS = [
  "broke after",
  "stopped working",
  "waste of money",
  "does not fit",
  "misleading",
  "poor quality",
  "customer service",
];

function difficultyToNumber(d) {
  const x = String(d || "").toLowerCase();
  if (x === "low") return 1;
  if (x === "high") return 3;
  return 2;
}

function parseTimeToCashDays(timeStr) {
  const t = String(timeStr || "");
  const m = t.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return (Number(m[1]) + Number(m[2])) / 2;
  const single = t.match(/(\d+)/);
  return single ? Number(single[1]) : 7;
}

async function fetchRedditHot(sub) {
  const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=12`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "AethraPortfolioExecution/1.0 (contact: ops@local)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return [];
    const j = await r.json();
    const children = j?.data?.children || [];
    return children
      .map((c) => c?.data)
      .filter(Boolean)
      .map((d) => ({
        title: String(d.title || "").slice(0, 220),
        score: Number(d.score) || 0,
        permalink: d.permalink ? `https://reddit.com${d.permalink}` : "",
      }));
  } catch {
    return [];
  }
}

function painScoreFromText(text) {
  const low = String(text || "").toLowerCase();
  let n = 0;
  for (const p of AMAZON_PAIN_TERMS) {
    if (low.includes(p)) n += 1;
  }
  if (/frustrat|hate|worst|scam|refund|complaint/i.test(low)) n += 2;
  return Math.min(10, n);
}

function clusterIdeaFromReddit(title, sub) {
  const t = title.replace(/\[.*?\]/g, "").trim();
  if (t.length < 12) return null;
  return {
    idea: `Solve: ${t.slice(0, 140)}`,
    source: `reddit:r/${sub}`,
    raw_signal: title,
  };
}

function googleTrendsStyleScore(keywords) {
  const joined = keywords.join(" ").toLowerCase();
  let momentum = 50;
  for (const k of ["ai", "automation", "saas", "b2b", "subscription", "compliance"]) {
    if (joined.includes(k)) momentum += 4;
  }
  return Math.min(95, momentum);
}

/**
 * Multi-source opportunity detection. Network calls degrade gracefully when blocked.
 * @param {{ seedText?: string, learning_keywords?: Record<string, number> }} opts
 * @returns {Promise<Array<{ idea: string, score: number, demand: number, difficulty: string, time_to_cash: string, monetisation_potential?: number, speed_to_launch?: number, competition_intensity?: string, sources?: string[] }>>}
 */
async function detectOpportunities(opts) {
  const options = opts && typeof opts === "object" ? opts : {};
  const seedText = String(options.seedText || options.text || "");
  const learning = options.learning_keywords && typeof options.learning_keywords === "object"
    ? options.learning_keywords
    : {};

  const outMap = new Map();

  const baseIdeas = generateIdeas({ text: seedText });
  for (const row of baseIdeas) {
    const demand = Math.min(0.95, row.score / 100 + 0.05);
    const difficulty = row.difficulty || "medium";
    const time_to_cash = row.time_to_money || "1 week";
    const days = parseTimeToCashDays(time_to_cash);
    const comp = difficulty === "high" ? "high" : difficulty === "low" ? "moderate" : "medium";
    const key = row.idea.toLowerCase().slice(0, 80);
    const learnBump = Object.keys(learning).reduce((acc, kw) => {
      if (row.idea.toLowerCase().includes(kw)) return acc + (Number(learning[kw]) || 0);
      return acc;
    }, 0);
    const score = Math.min(98, row.score + learnBump);
    outMap.set(key, {
      idea: row.idea,
      score,
      demand,
      difficulty,
      time_to_cash,
      monetisation_potential: score,
      speed_to_launch: Math.max(1, 14 - days),
      competition_intensity: comp,
      sources: ["idea_generator", "base_catalog"],
      reason: row.reason,
    });
  }

  const redditTasks = REDDIT_SUBS.map((sub) => fetchRedditHot(sub));
  const redditResults = await Promise.all(redditTasks);
  REDDIT_SUBS.forEach((sub, i) => {
    for (const post of redditResults[i] || []) {
      const clustered = clusterIdeaFromReddit(post.title, sub);
      if (!clustered) continue;
      const pain = painScoreFromText(post.title);
      const demand = Math.min(0.92, 0.45 + pain * 0.04 + Math.min(0.15, post.score / 500));
      const key = clustered.idea.toLowerCase().slice(0, 80);
      const trendBoost = googleTrendsStyleScore(tokenize(clustered.idea));
      const score = Math.min(
        96,
        58 + pain * 2 + Math.min(12, post.score / 80) + (trendBoost - 50) * 0.15
      );
      const existing = outMap.get(key);
      if (existing && existing.score >= score) continue;
      outMap.set(key, {
        idea: clustered.idea,
        score,
        demand,
        difficulty: pain >= 4 ? "low" : "medium",
        time_to_cash: pain >= 4 ? "3–7 days" : "1–2 weeks",
        monetisation_potential: score,
        speed_to_launch: pain >= 4 ? 10 : 6,
        competition_intensity: post.score > 200 ? "high" : "moderate",
        sources: ["reddit", clustered.source],
        raw_signal: clustered.raw_signal,
      });
    }
  });

  for (const t of TIKTOK_STYLE_SEEDS) {
    const idea = `Trending wedge: ${t.product} (${t.wave})`;
    const key = idea.toLowerCase().slice(0, 80);
    const score = Math.round(62 + t.demand * 28);
    if (!outMap.has(key)) {
      outMap.set(key, {
        idea,
        score,
        demand: t.demand,
        difficulty: "medium",
        time_to_cash: "5–10 days",
        monetisation_potential: score,
        speed_to_launch: 8,
        competition_intensity: "high",
        sources: ["tiktok_style_trends"],
      });
    }
  }

  const list = [...outMap.values()];
  list.sort((a, b) => b.score - a.score);
  return list.slice(0, 24);
}

function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

module.exports = { detectOpportunities, difficultyToNumber, parseTimeToCashDays };
