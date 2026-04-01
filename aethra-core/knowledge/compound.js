"use strict";

const fs = require("fs");
const path = require("path");
const { deriveInsights } = require(path.join(__dirname, "..", "memory", "intelligence.js"));

const COMPOUND_FILE = path.join(__dirname, "compounded.jsonl");

function compoundKnowledge(ctx = {}) {
  const insights = deriveInsights();
  const row = {
    kind: "compounded_insight",
    insights,
    context: ctx,
  };
  fs.appendFileSync(COMPOUND_FILE, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");

  let lines = 1;
  try {
    lines = fs.readFileSync(COMPOUND_FILE, "utf8").split(/\r?\n/).filter(Boolean).length;
  } catch {
    lines = 1;
  }

  const knowledge_leverage_score = Number(Math.min(100, Math.log10(lines + 10) * 28).toFixed(2));

  return {
    knowledge_leverage_score,
    store: COMPOUND_FILE,
    latest: insights,
  };
}

module.exports = { compoundKnowledge, COMPOUND_FILE };
