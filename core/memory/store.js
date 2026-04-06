"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DATA_FILE = path.join(__dirname, "organism_memory.json");

const MAX_LOG = 5000;

function defaultMemory() {
  return {
    totalRevenue: 0,
    verifiedRevenueGbp: 0,
    totalDeployments: 0,
    successRate: 0,
    activeSystems: 0,
    opportunitiesEvaluated: 0,
    failuresRecorded: 0,
    templatesUsed: {},
    conversionRates: [],
    historicalLog: [],
    lastUpdated: 0,
  };
}

function readFileSafe() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const j = JSON.parse(raw);
    const base = defaultMemory();
    if (typeof j.totalRevenue === "number") base.totalRevenue = j.totalRevenue;
    if (typeof j.verifiedRevenueGbp === "number") base.verifiedRevenueGbp = j.verifiedRevenueGbp;
    else base.verifiedRevenueGbp = 0;
    if (typeof j.totalDeployments === "number") base.totalDeployments = j.totalDeployments;
    if (typeof j.successRate === "number") base.successRate = j.successRate;
    if (typeof j.activeSystems === "number") base.activeSystems = j.activeSystems;
    if (typeof j.opportunitiesEvaluated === "number") base.opportunitiesEvaluated = j.opportunitiesEvaluated;
    if (typeof j.failuresRecorded === "number") base.failuresRecorded = j.failuresRecorded;
    if (j.templatesUsed && typeof j.templatesUsed === "object") base.templatesUsed = { ...j.templatesUsed };
    if (Array.isArray(j.conversionRates)) base.conversionRates = j.conversionRates.slice(-2000);
    if (Array.isArray(j.historicalLog)) base.historicalLog = j.historicalLog;
    return base;
  } catch {
    return defaultMemory();
  }
}

function writeFileSafe(mem) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(mem, null, 2), "utf8");
  } catch {
    /* non-fatal */
  }
}

function loadMemory() {
  return readFileSafe();
}

/**
 * Append-only: push to historicalLog; refresh aggregates from log tails (cumulative).
 * @param {Record<string, unknown>} entry
 */
function appendHistorical(entry) {
  const mem = readFileSafe();
  const row = {
    ts: Date.now(),
    ...entry,
  };
  mem.historicalLog.push(row);
  while (mem.historicalLog.length > MAX_LOG) mem.historicalLog.shift();

  const recent = mem.historicalLog.slice(-400);
  const deploys = recent.filter((r) => r.kind === "deployment");
  const wins = deploys.filter((r) => r.outcome === "strong" || r.outcome === "scale");
  mem.totalDeployments = mem.historicalLog.filter((r) => r.kind === "deployment").length;
  mem.opportunitiesEvaluated = mem.historicalLog.filter((r) => r.kind === "opportunity_eval").length;
  mem.failuresRecorded = mem.historicalLog.filter((r) => r.kind === "failure" || r.outcome === "kill").length;
  if (deploys.length) {
    mem.successRate = Math.round((wins.length / deploys.length) * 1000) / 1000;
  }
  mem.lastUpdated = Date.now();
  writeFileSafe(mem);
  return row;
}

function bumpTemplateUsage(templateId) {
  const mem = readFileSafe();
  const id = String(templateId || "unknown").slice(0, 80);
  mem.templatesUsed[id] = (Number(mem.templatesUsed[id]) || 0) + 1;
  mem.lastUpdated = Date.now();
  writeFileSafe(mem);
}

function recordConversionRate(rate) {
  const r = Math.max(0, Math.min(1, Number(rate) || 0));
  const mem = readFileSafe();
  mem.conversionRates.push({ ts: Date.now(), rate: r });
  while (mem.conversionRates.length > 500) mem.conversionRates.shift();
  mem.lastUpdated = Date.now();
  writeFileSafe(mem);
}

function setActiveSystemsCount(n) {
  const mem = readFileSafe();
  mem.activeSystems = Math.max(0, Number(n) || 0);
  mem.lastUpdated = Date.now();
  writeFileSafe(mem);
}

function addTotalRevenueDelta(amountGbp) {
  addVerifiedRevenueDelta(amountGbp);
}

/** Book only high-confidence (e.g. Stripe-classified) cash — no synthetic performance GBP. */
function addVerifiedRevenueDelta(amountGbp) {
  const a = Math.round(Number(amountGbp) * 100) / 100;
  if (!Number.isFinite(a) || a <= 0) return;
  const mem = readFileSafe();
  mem.verifiedRevenueGbp = Math.round((Number(mem.verifiedRevenueGbp || 0) + a) * 100) / 100;
  mem.totalRevenue = mem.verifiedRevenueGbp;
  mem.lastUpdated = Date.now();
  writeFileSafe(mem);
}

module.exports = {
  loadMemory,
  appendHistorical,
  bumpTemplateUsage,
  recordConversionRate,
  setActiveSystemsCount,
  addTotalRevenueDelta,
  addVerifiedRevenueDelta,
  DATA_FILE,
  ROOT,
};
