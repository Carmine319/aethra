"use strict";

const memory = require("./index.js");

/**
 * Failures are training data: extract anti-patterns and log preventive learnings.
 */
function utiliseFailures(limit = 80) {
  const rows = memory.readJsonl(memory.FILES.failures, limit);
  const themes = {};
  for (const f of rows) {
    const k = String(f.reason || f.legacy_reason || "unknown");
    themes[k] = (themes[k] || 0) + 1;
  }

  const prevention = [];
  for (const [reason, count] of Object.entries(themes)) {
    if (count >= 2) {
      prevention.push({
        reason,
        count,
        guardrail: `Avoid repeat: ${reason} — tighten validation before deploy.`,
      });
    }
  }

  if (prevention.length) {
    memory.logLearning({
      type: "failure_utilisation",
      themes,
      prevention,
    });
  }

  return { themes, prevention, samples_used: rows.length };
}

module.exports = { utiliseFailures };
