/**
 * Mock lead discovery — structured output, ICP keyword filter, dedupe.
 * API-ready: replace findLeads body with Maps / directory providers later.
 */

"use strict";

const MOCK_SEEDS = [
  { name: "Northline Facilities Ltd", email: "ops@northline-fac.example", phone: "+44 20 7946 0958", location: "London EC1" },
  { name: "Crestmoor Hospitality Group", email: "procurement@crestmoor.example", phone: "+44 161 496 0200", location: "Manchester M1" },
  { name: "Harbourview Estates", email: "maintenance@harbourview.example", phone: "+44 113 496 0800", location: "Leeds LS1" },
  { name: "Silverstream Clinics", email: "facilities@silverstream.example", phone: "+44 121 496 0123", location: "Birmingham B1" },
  { name: "Urban Fork Catering", email: "hello@urbanfork.example", phone: "+44 20 7123 4567", location: "London SE1" },
  { name: "Bluecrest Industrial", email: "buyers@bluecrest.example", phone: "+44 191 496 0300", location: "Newcastle NE1" },
  { name: "Greenfield Retail Co", email: "store.ops@greenfield.example", phone: "+44 117 496 0400", location: "Bristol BS1" },
  { name: "Atlas Workspace Co", email: "facilities@atlasws.example", phone: "+44 20 7456 7890", location: "London W1" },
  { name: "Riverstone Hotels", email: "engineering@riverstone.example", phone: "+44 131 496 0500", location: "Edinburgh EH1" },
  { name: "Meridian Logistics UK", email: "contracts@meridian-lg.example", phone: "+44 20 7555 0199", location: "London E14" },
  { name: "Oakwood Schools Trust", email: "estates@oakwood-trust.example", phone: "+44 20 8444 0222", location: "London NW4" },
  { name: "Pulse Fitness Chain", email: "ops@pulsefit.example", phone: "+44 20 7333 0888", location: "London SW4" },
];

function tokenizeIcp(target_customer) {
  const t = String(target_customer || "").toLowerCase();
  return [...new Set(t.match(/[a-z0-9]{3,}/g) || [])].filter((w) => w.length > 2);
}

function scoreLead(seed, keywords) {
  if (!keywords.length) return 72;
  const blob = `${seed.name} ${seed.location}`.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    if (blob.includes(k)) hits++;
  }
  const base = 45 + Math.min(45, hits * 12 + (seed.location.includes("London") ? 8 : 0));
  return Math.min(99, base);
}

function findLeads(target_customer) {
  const keywords = tokenizeIcp(target_customer);
  const seen = new Set();
  const out = [];

  for (let i = 0; i < MOCK_SEEDS.length; i++) {
    const seed = MOCK_SEEDS[i];
    const key = `${seed.email}|${seed.phone}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const niche_score = scoreLead(seed, keywords);
    if (keywords.length && niche_score < 52) continue;

    out.push({
      id: `lead_${i + 1}`,
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      location: seed.location,
      niche_score,
    });
  }

  out.sort((a, b) => b.niche_score - a.niche_score);
  return out.slice(0, 12);
}

module.exports = { findLeads, tokenizeIcp };
