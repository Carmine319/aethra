"use strict";

const path = require("path");
const { readSystemState, computeSystemState } = require(path.join(__dirname, "..", "state", "engine.js"));

function readStateBeforeAction(ctx = {}) {
  const existing = readSystemState();
  if (existing && existing.ts && Date.now() - Number(existing.ts) < 30_000) return existing;
  return computeSystemState(ctx);
}

module.exports = { readStateBeforeAction };
