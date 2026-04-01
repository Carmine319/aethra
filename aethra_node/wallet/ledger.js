"use strict";

/**
 * Allocation ledger — credits from Stripe top-ups, debits for tracked spend.
 * Not a bank; append-style history for audit. Pairs with venture/wallet liquid pool.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "user_wallet_ledger.json");
const MAX_EVENTS = 200;

function defaultState() {
  return { users: {} };
}

function readState() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!j.users || typeof j.users !== "object") j.users = {};
    return j;
  } catch {
    return defaultState();
  }
}

function writeState(s) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(s, null, 2), "utf8");
  } catch {
    /* non-fatal */
  }
}

function ensureUser(st, userId) {
  const id = String(userId || "anonymous").slice(0, 120);
  if (!st.users[id]) {
    st.users[id] = { balance: 0, events: [] };
  }
  return st.users[id];
}

function pushEvent(row, evt) {
  row.events.unshift(evt);
  while (row.events.length > MAX_EVENTS) row.events.pop();
}

/**
 * Credit ledger (e.g. Stripe checkout.session.completed for wallet_topup).
 */
function credit(userId, amount, meta = {}) {
  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "bad_amount" };
  const st = readState();
  const row = ensureUser(st, userId);
  row.balance = Math.round((Number(row.balance || 0) + n) * 100) / 100;
  pushEvent(row, {
    type: "credit",
    amount: n,
    at: Date.now(),
    ...meta,
  });
  writeState(st);
  return { ok: true, balance: row.balance };
}

/**
 * Debit ledger when AETHRA deploys funds (ads, tools, procurement).
 */
function debit(userId, amount, meta = {}) {
  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "bad_amount" };
  const st = readState();
  const row = ensureUser(st, userId);
  const bal = Number(row.balance || 0);
  if (bal < n) return { ok: false, reason: "insufficient", balance: bal };
  row.balance = Math.round((bal - n) * 100) / 100;
  pushEvent(row, { type: "debit", amount: n, at: Date.now(), ...meta });
  writeState(st);
  return { ok: true, balance: row.balance };
}

function getBalance(userId) {
  const st = readState();
  const row = st.users[String(userId || "anonymous").slice(0, 120)];
  return row ? Math.round(Number(row.balance || 0) * 100) / 100 : 0;
}

function getRecentEvents(userId, limit = 12) {
  const st = readState();
  const row = st.users[String(userId || "anonymous").slice(0, 120)];
  if (!row || !Array.isArray(row.events)) return [];
  return row.events.slice(0, limit);
}

module.exports = {
  credit,
  debit,
  getBalance,
  getRecentEvents,
  LEDGER_FILE: FILE,
};
