"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "wallet_state.json");

function readState() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return {
      balance: Number(j.balance) || 100,
      ventures: Array.isArray(j.ventures) ? j.ventures : [],
      reinvest_pool: Number(j.reinvest_pool) || 0,
      ledger: Array.isArray(j.ledger) ? j.ledger : [],
    };
  } catch {
    return { balance: 100, ventures: [], reinvest_pool: 0, ledger: [] };
  }
}

function writeState(s) {
  const out = {
    balance: s.balance,
    ventures: s.ventures,
    reinvest_pool: s.reinvest_pool || 0,
    ledger: Array.isArray(s.ledger) ? s.ledger.slice(-200) : [],
  };
  try {
    fs.writeFileSync(FILE, JSON.stringify(out, null, 2), "utf8");
  } catch {
    /* disk / permission — keep process alive; in-memory state still consistent until next read */
  }
}

function getBalance() {
  return readState().balance;
}

function allocate(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, balance: readState().balance };
  const s = readState();
  if (n > s.balance) return { ok: false, balance: s.balance };
  s.balance = Math.round((s.balance - n) * 100) / 100;
  pushLedger(s, { type: "allocate", amount: n, at: Date.now() });
  writeState(s);
  return { ok: true, balance: s.balance };
}

function addRevenue(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, balance: readState().balance };
  const s = readState();
  s.balance = Math.round((s.balance + n) * 100) / 100;
  pushLedger(s, { type: "revenue", amount: n, at: Date.now() });
  writeState(s);
  return { ok: true, balance: s.balance };
}

function pushLedger(s, row) {
  if (!Array.isArray(s.ledger)) s.ledger = [];
  s.ledger.push(row);
  if (s.ledger.length > 200) s.ledger = s.ledger.slice(-200);
}

function recordReinvest(ventureName, amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return;
  const s = readState();
  s.reinvest_pool = Math.round(((s.reinvest_pool || 0) + n) * 100) / 100;
  pushLedger(s, { type: "reinvest_tag", venture: ventureName, amount: n, at: Date.now() });
  writeState(s);
}

function allocateFromReinvest(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, balance: readState().balance };
  const s = readState();
  const pool = s.reinvest_pool || 0;
  if (n > pool) return { ok: false, balance: s.balance, reinvest_pool: pool };
  s.reinvest_pool = Math.round((pool - n) * 100) / 100;
  pushLedger(s, { type: "reinvest_spend", amount: n, at: Date.now() });
  writeState(s);
  return { ok: true, balance: s.balance, reinvest_pool: s.reinvest_pool };
}

function getWalletSummary() {
  const s = readState();
  return {
    balance: s.balance,
    reinvest_pool: s.reinvest_pool || 0,
    ventures: s.ventures.map((x) => ({ ...x })),
  };
}

function findVentureByName(name) {
  const n = String(name || "").trim();
  if (!n) return null;
  const s = readState();
  return s.ventures.find((x) => String(x.name || "") === n) || null;
}

function recordVentureAllocation(name, amount) {
  const s = readState();
  const n = String(name || "").trim();
  const existing = s.ventures.find((x) => String(x.name || "") === n);
  const alloc = Math.round(Number(amount) * 100) / 100;
  if (existing) {
    existing.budget = Math.round((Number(existing.budget || 0) + alloc) * 100) / 100;
    existing.allocated_at = Date.now();
  } else {
    s.ventures.push({
      name: n,
      budget: alloc,
      allocated_at: Date.now(),
      revenue: 0,
      roi: 0,
    });
  }
  writeState(s);
}

function updateVentureRevenue(name, revenueDelta) {
  const s = readState();
  const v = s.ventures.find((x) => x.name === name);
  if (!v) return;
  v.revenue = Math.round((Number(v.revenue || 0) + Number(revenueDelta)) * 100) / 100;
  v.roi = v.budget > 0 ? Math.round((v.revenue / v.budget) * 1000) / 1000 : 0;
  writeState(s);
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function getWalletsBreakdown() {
  const s = readState();
  const wallets = [{ type: "core", balance: round2(s.balance) }];
  for (const v of s.ventures) {
    if (v.archived) continue;
    wallets.push({
      type: "venture",
      name: String(v.name || ""),
      balance: round2(Number(v.budget) || 0),
    });
  }
  return wallets;
}

/** Liquid GBP plus non-archived venture budgets (committed + spendable). */
function getTotalBalance() {
  const s = readState();
  let t = round2(s.balance);
  for (const v of s.ventures) {
    if (!v.archived) t += round2(Number(v.budget) || 0);
  }
  return round2(t);
}

function bumpVentureOutreach(name) {
  const n = String(name || "").trim();
  if (!n) return;
  const s = readState();
  const v = s.ventures.find((x) => String(x.name || "") === n);
  if (!v) return;
  v.outreach_rounds = (Number(v.outreach_rounds) || 0) + 1;
  v.last_operator_cycle_at = Date.now();
  writeState(s);
}

function archiveVenture(name, outcome = "fail") {
  const n = String(name || "").trim();
  if (!n) return false;
  const s = readState();
  const v = s.ventures.find((x) => String(x.name || "") === n);
  if (!v || v.archived) return false;
  v.archived = true;
  v.outcome = String(outcome || "fail");
  v.archived_at = Date.now();
  writeState(s);
  return true;
}

function getActiveVentures() {
  return readState().ventures.map((x) => ({ ...x }));
}

module.exports = {
  getBalance,
  allocate,
  addRevenue,
  recordVentureAllocation,
  findVentureByName,
  updateVentureRevenue,
  getActiveVentures,
  recordReinvest,
  allocateFromReinvest,
  getWalletSummary,
  getWalletsBreakdown,
  getTotalBalance,
  bumpVentureOutreach,
  archiveVenture,
  WALLET_FILE: FILE,
};
