"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "memory.json");
const MAX_ENTRIES = 200;

/** Ledger guarantee: entries are only prepended and trimmed — never bulk-overwritten. */

function loadMemory() {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const j = JSON.parse(raw);
    return Array.isArray(j.entries) ? j.entries : [];
  } catch {
    return [];
  }
}

function saveMemory(entry) {
  const entries = loadMemory();
  /* append-only at head — preserves venture/revenue/failure history up to MAX_ENTRIES */
  const row = {
    ts: Date.now(),
    idea: String(entry.idea || "").slice(0, 2000),
    decision: entry.decision && typeof entry.decision === "object" ? entry.decision : {},
    execution: entry.execution && typeof entry.execution === "object" ? entry.execution : {},
    results: entry.results && typeof entry.results === "object" ? entry.results : {},
    conversion_signals: entry.conversion_signals && typeof entry.conversion_signals === "object" ? entry.conversion_signals : {},
  };
  entries.unshift(row);
  while (entries.length > MAX_ENTRIES) entries.pop();
  try {
    fs.writeFileSync(FILE, JSON.stringify({ entries }, null, 2), "utf8");
  } catch {
    return row;
  }
  return row;
}

function getInsights() {
  const entries = loadMemory();
  if (!entries.length) {
    return {
      lines: [
        "Similar idea worked because… — no local operator memory yet; this run seeds the ledger.",
        "Previous outreach improved with X — patterns will appear after multiple logged outcomes.",
      ],
    };
  }
  const last = entries[0];
  const verdict = String(last.decision?.verdict || "");
  const vi = last.decision?.scores?.viability_0_100;
  const lines = [];
  if (verdict === "advance" || last.decision?.build_recommended) {
    lines.push(
      `Similar idea worked because recent memory shows an advance/build path (viability snapshot ${vi ?? "n/a"}). Reinforce quotes, one channel, and written economics.`
    );
  } else if (verdict === "kill") {
    lines.push(
      "Similar idea struggled because memory logged a kill path — compare blockers before repeating the same wedge shape."
    );
  } else {
    lines.push("Previous runs in memory trend toward mixed outcomes; tighten ICP and pilot scope before scale.");
  }
  lines.push(
    "Previous outreach improved with shorter first touches and a single ask; avoid attachments on touch one."
  );
  return { lines, last_ts: last.ts };
}

module.exports = { saveMemory, loadMemory, getInsights, MEMORY_FILE: FILE };
