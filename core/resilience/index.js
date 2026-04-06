"use strict";

const { appendHistorical } = require("../memory/store");
const { spawnAgentForFriction } = require("../agents/spawn");

function detectFailure(err, context) {
  const msg = err ? String(err.message || err) : "unknown_error";
  const row = {
    kind: "failure",
    error: msg.slice(0, 500),
    context: context && typeof context === "object" ? context : {},
    ts: Date.now(),
  };
  appendHistorical(row);
  return { failed: true, ...row };
}

/**
 * @param {() => Promise<T>} fn
 * @param {{ label?: string, fallback?: () => Promise<T> }} [opts]
 * @returns {Promise<{ ok: boolean, result?: T, recovered?: boolean, error?: string }>}
 */
async function recoverExecution(fn, opts) {
  const label = String(opts?.label || "execution");
  try {
    const result = await fn();
    return { ok: true, result };
  } catch (e) {
    detectFailure(e, { label });
    if (typeof opts?.fallback === "function") {
      try {
        const result = await opts.fallback();
        appendHistorical({ kind: "resilience_recover", label, via: "fallback" });
        return { ok: true, result, recovered: true };
      } catch (e2) {
        spawnAgentForFriction(`${label}:${String(e2.message || e2)}`);
        return { ok: false, error: String(e2.message || e2) };
      }
    }
    spawnAgentForFriction(`${label}:${String(e.message || e)}`);
    return { ok: false, error: String(e.message || e) };
  }
}

function reassignStrategy(reason) {
  const r = String(reason || "stall_detected").slice(0, 200);
  appendHistorical({ kind: "strategy_reassign", reason: r });
  return {
    deploy_limit: 1,
    seedText: "recovery scan — narrowed scope",
    note: "Fallback strategy engaged to avoid dead state.",
  };
}

module.exports = {
  detectFailure,
  recoverExecution,
  reassignStrategy,
};
