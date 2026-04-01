"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "economic_system_memory.json");
const MAX_ROWS = 500;

function readState() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!Array.isArray(j.rows)) j.rows = [];
    return j;
  } catch {
    return { rows: [] };
  }
}

function writeState(st) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(st, null, 2), "utf8");
  } catch {
    /* non-fatal */
  }
}

function appendEconomicMemory(entry) {
  const st = readState();
  const row = {
    ts: Date.now(),
    ...((entry && typeof entry === "object") ? entry : { note: String(entry || "") }),
  };
  st.rows.unshift(row);
  while (st.rows.length > MAX_ROWS) st.rows.pop();
  writeState(st);
  return row;
}

function listEconomicMemory(limit = 40) {
  const st = readState();
  return (st.rows || []).slice(0, limit);
}

module.exports = { appendEconomicMemory, listEconomicMemory, FILE };