"use strict";

const { findLeads } = require("../operator/leadEngine");
const { appendEconomicMemory } = require("../profit/systemMemory");

const SOURCES = ["google_maps", "business_directory", "linkedin_role"];

function normalizeLead(row, niche, source, idx) {
  return {
    name: String(row.name || `Lead ${idx + 1}`),
    business: String(row.name || `Business ${idx + 1}`),
    email: String(row.email || `hello+${idx + 1}@example.com`),
    source,
    niche,
  };
}

function generateLeads(nicheEnvelope) {
  const niche = String((nicheEnvelope && nicheEnvelope.selected && nicheEnvelope.selected.niche) || "operations services");
  const raw = findLeads(niche);
  const out = [];
  for (let i = 0; i < 20; i++) {
    const src = SOURCES[i % SOURCES.length];
    const row = raw[i % Math.max(1, raw.length)] || {};
    out.push(normalizeLead(row, niche, src, i));
  }
  appendEconomicMemory({ kind: "leads_batch", niche, count: out.length });
  return out;
}

module.exports = { generateLeads };