"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { writeActionLog } = require(path.join(__dirname, "..", "utils.js"));

const PROBLEM_TAGS = [
  /I want to start a business/i,
  /I'm stuck|I am stuck/i,
  /I need income/i,
  /side hustle/i,
];

function classifyProblem(text) {
  const t = String(text || "");
  for (const r of PROBLEM_TAGS) if (r.test(t)) return t.slice(0, 140);
  return "";
}

function llmDetectProblem(text) {
  const hit = classifyProblem(text);
  return hit ? hit : "general founder intent detected";
}

function scrapeLeads() {
  const seeds = [
    { name: "public_linkedin_1", platform: "linkedin", snippet: "I want to start a business but I'm stuck on validation." },
    { name: "reddit_startups", platform: "reddit", snippet: "Side hustle idea needs income in 30 days." },
    { name: "x_thread", platform: "x", snippet: "Need income stream; exploring SaaS automation." },
    { name: "indiehackers", platform: "indiehackers", snippet: "Looking for process to launch faster with AI." },
  ];

  const out = seeds.map((s) => {
    const problem = llmDetectProblem(s.snippet);
    return {
      name: s.name,
      platform: s.platform,
      problem_detected: problem,
      contact_method: s.platform === "reddit" ? "reddit_dm" : s.platform === "x" ? "x_dm" : "linkedin_inmail",
    };
  });

  for (const row of out) memory.logLead(row);
  writeActionLog({ type: "lead_scrape", count: out.length });
  return out;
}

module.exports = { scrapeLeads, classifyProblem, llmDetectProblem };