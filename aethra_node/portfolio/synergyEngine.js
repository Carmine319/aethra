"use strict";

const { loadMemory } = require("../memory/memory");

/**
 * Synergy view: memory + ledger signals only — no fabricated "wins".
 */
function getSynergyInsights({ ventures = [], learningLines = [], execution = {}, brand = {} }) {
  const shared_patterns = [];
  const name = String(brand.brand_name || brand.name || "").trim();
  const channel = execution.acquisition_channel || execution.channel;
  const offer = String(execution.offer || execution.product_focus || "").slice(0, 120);

  if (channel) {
    shared_patterns.push(`Acquisition focus logged: ${String(channel).slice(0, 80)}`);
  }
  if (offer) {
    shared_patterns.push(`Offer shape in this run: ${offer}${offer.length >= 120 ? "…" : ""}`);
  }

  let entries = [];
  try {
    entries = loadMemory() || [];
  } catch {
    entries = [];
  }
  if (entries.length > 1) {
    const lastVerdict = String(entries[0]?.decision?.verdict || "");
    const prevVerdict = String(entries[1]?.decision?.verdict || "");
    if (lastVerdict && lastVerdict === prevVerdict) {
      shared_patterns.push(`Repeated verdict pattern in memory: ${lastVerdict.toUpperCase()}`);
    }
  }

  const n = Array.isArray(ventures) ? ventures.length : 0;
  let cross_impact = null;
  if (n >= 2) {
    cross_impact = `Operator modules (CRM + outreach scaffolding) apply across ${n} ventures in the current ledger — review economics per name before scaling any line.`;
  } else if (n === 1 && learningLines[0]) {
    cross_impact = `Learning signal: ${String(learningLines[0]).slice(0, 160)}`;
  }

  return {
    aethra_portfolio: "System-run ledger: wallet + venture rows below are autonomous state.",
    user_portfolio: name
      ? `This run: «${name.slice(0, 48)}» — guided execution merges into memory for reuse.`
      : "Submit ideas or URLs — outcomes accrue into the same memory spine as autonomous runs.",
    shared_patterns,
    cross_impact,
  };
}

module.exports = { getSynergyInsights };
