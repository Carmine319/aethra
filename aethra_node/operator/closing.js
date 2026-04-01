"use strict";

function generateClosingMessage(category) {
  const c = String(category || "follow_up").toLowerCase();
  if (c === "interested") {
    return (
      "To close cleanly: confirm the pilot scope in writing today, issue invoice or payment link for the agreed deposit, " +
      "and calendar the kick-off within 72 hours. Ambiguity on scope is the main failure mode — remove it first."
    );
  }
  if (c === "objection") {
    return (
      "To recover without pressure: offer a reduced first step with a hard cap (£ or hours), a single success metric, " +
      "and a dated decision. If they decline twice, archive — do not lengthen the thread."
    );
  }
  if (c === "ignore") {
    return "No close required. Log as closed-lost with reason “no signal” and reallocate time to warmer leads.";
  }
  return (
    "Advance the thread with one concrete next step: price or pilot boundary, plus a deadline this Friday. " +
    "Clarity beats persuasion in the final mile."
  );
}

module.exports = { generateClosingMessage };
