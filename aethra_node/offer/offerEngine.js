"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

function chooseDiagnosticPrice(nicheScore) {
  if (nicheScore >= 85) return "GBP 149";
  if (nicheScore >= 75) return "GBP 99";
  return "GBP 49";
}

function generateOffer(nicheEnvelope = {}) {
  const selected = nicheEnvelope.selected || {};
  const niche = String(selected.niche || "operations teams");
  const price = chooseDiagnosticPrice(Number(selected.score) || 70);

  const offer = {
    title: `Structured Diagnostic - ${niche}`,
    promise: `Problem: hidden operational leakage in ${niche}. Outcome: clear pass/fail viability plus execution route with measurable margin impact.`,
    timeframe: "Delivered within 24-48 hours after a 15-minute call",
    guarantee: "If no actionable gap is identified, the diagnostic fee is credited toward the next execution cycle.",
    price,
  };

  appendEconomicMemory({ kind: "offer_used", niche, offer });
  return offer;
}

module.exports = { generateOffer, chooseDiagnosticPrice };