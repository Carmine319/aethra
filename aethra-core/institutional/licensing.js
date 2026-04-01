"use strict";

const { requiresHumanGate } = require("./operator.js");

const LICENCE_TIERS = [
  {
    key: "tier_1_pilot",
    label: "Tier 1 Pilot",
    price_gbp: "5000",
    term: "90 days",
    scope: "1 use case",
    includes: ["controlled access", "human-gated execution", "TrustOrigin verification", "dossier delivery"],
    raw_system_access: false,
  },
  {
    key: "tier_2_single_domain",
    label: "Tier 2 Single Domain Licence",
    price_gbp: "15000/year",
    term: "12 months",
    scope: "single domain",
    includes: [
      "controlled access",
      "human-gated execution",
      "TrustOrigin verification",
      "quarterly institutional dossier",
    ],
    raw_system_access: false,
  },
  {
    key: "tier_3_multi_domain",
    label: "Tier 3 Multi-Domain Licence",
    price_gbp: "30000/year",
    term: "12 months",
    scope: "multi-domain",
    includes: [
      "controlled access",
      "human-gated execution",
      "TrustOrigin verification",
      "multi-stream dossier package",
    ],
    raw_system_access: false,
  },
  {
    key: "tier_4_strategic",
    label: "Tier 4 Strategic Licence",
    price_gbp: "50000-100000/year",
    term: "12 months",
    scope: "strategic infrastructure access",
    includes: [
      "controlled access",
      "human-gated execution",
      "TrustOrigin verification",
      "executive operating cadence",
    ],
    raw_system_access: false,
  },
];

function getLicenceTier(key) {
  const tier = LICENCE_TIERS.find((t) => t.key === key);
  if (!tier) throw new Error(`Unknown licence tier: ${key}`);
  return tier;
}

function createLicenceOffer(key) {
  const tier = getLicenceTier(key);
  return {
    ...tier,
    manual_approval_required: true,
    limited_licences_per_quarter: true,
    public_price_negotiation: false,
    no_self_serve_saas: true,
    no_raw_system_access: tier.raw_system_access === false,
    execution_gate: requiresHumanGate() ? "human_gate_enabled" : "gate_missing",
    positioning: "Controlled infrastructure access",
  };
}

module.exports = { LICENCE_TIERS, getLicenceTier, createLicenceOffer };
