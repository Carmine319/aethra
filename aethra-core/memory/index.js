"use strict";

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const FILES = {
  ventures: path.join(DIR, "ventures.json"),
  revenue: path.join(DIR, "revenue.json"),
  failures: path.join(DIR, "failures.json"),
  learnings: path.join(DIR, "learnings.json"),
  leads: path.join(DIR, "leads.json"),
  metrics: path.join(DIR, "metrics.json"),
};

function appendLine(file, obj) {
  const row = JSON.stringify({ ts: Date.now(), ...obj });
  fs.appendFileSync(file, row + "\n", "utf8");
  return row;
}

function readJsonl(file, limit = 300) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    return lines.slice(-Math.max(1, limit)).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function logVenture(entry) { return appendLine(FILES.ventures, { kind: "venture", ...entry }); }
function logRevenue(entry) { return appendLine(FILES.revenue, { kind: "revenue", ...entry }); }
function logFailure(entry) { return appendLine(FILES.failures, { kind: "failure", ...entry }); }
function logLearning(entry) { return appendLine(FILES.learnings, { kind: "learning", ...entry }); }
function logLead(entry) { return appendLine(FILES.leads, { kind: "lead", ...entry }); }
function logMetric(entry) { return appendLine(FILES.metrics, { kind: "metric", ...entry }); }

function getInsights() {
  const ventures = readJsonl(FILES.ventures, 500);
  const revenue = readJsonl(FILES.revenue, 500);
  const failures = readJsonl(FILES.failures, 500);
  const learnings = readJsonl(FILES.learnings, 500);
  const totalRevenue = revenue.reduce((a, r) => a + Number(r.amount || 0), 0);
  const active = ventures.filter((v) => v.status === "live" || v.status === "building").length;
  const killed = ventures.filter((v) => v.status === "killed").length;
  return { ventures, revenue, failures, learnings, metrics: { totalRevenue, launched: ventures.length, active, killed } };
}

function getTopPerformingPatterns() {
  const ventures = readJsonl(FILES.ventures, 1000);
  const byNiche = new Map();
  for (const v of ventures) {
    const key = String(v.niche || v.idea || "unknown").slice(0, 80);
    const cur = byNiche.get(key) || { launches: 0, revenue: 0 };
    cur.launches += 1;
    cur.revenue += Number(v.revenue || 0);
    byNiche.set(key, cur);
  }
  return [...byNiche.entries()].map(([pattern, x]) => ({ pattern, ...x })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

module.exports = {
  FILES,
  logVenture,
  logRevenue,
  logFailure,
  logLearning,
  logLead,
  logMetric,
  getInsights,
  getTopPerformingPatterns,
  readJsonl,
};