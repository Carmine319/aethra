"use strict";

const fs = require("fs");
const path = require("path");

const LIB_PATH = path.join(__dirname, "supplyLibrary.json");
let cache = null;

function loadLib() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(LIB_PATH, "utf8"));
  } catch {
    cache = { version: 0, keywords: {}, industries: {}, policy: "library_unavailable" };
  }
  return cache;
}

function tokenMatch(query, tokens) {
  const q = String(query || "").toLowerCase();
  return (tokens || []).some((t) => q.includes(String(t).toLowerCase()));
}

/**
 * Layer 1 — internal curated library (JSON).
 */
function getCuratedLayer(query) {
  const lib = loadLib();
  const q = String(query || "").slice(0, 400);
  let matchedSub = null;
  const kw = lib.keywords || {};
  for (const [sub, tokens] of Object.entries(kw)) {
    if (tokenMatch(q, tokens)) {
      matchedSub = sub;
      break;
    }
  }

  if (!matchedSub) {
    return {
      matched: false,
      industry: null,
      subcategory: null,
      label: null,
      suppliers: [],
      equipment_suppliers: [],
      backup_suppliers: [],
      china_manufacturers: [],
      source: "aethra_curated_library",
      policy: lib.policy,
      note: "No curated pack for this phrasing — use Layer 2 connectors and operator verification.",
    };
  }

  const industries = lib.industries || {};
  for (const [industry, subs] of Object.entries(industries)) {
    const pack = subs[matchedSub];
    if (pack) {
      return {
        matched: true,
        industry,
        subcategory: matchedSub,
        label: pack.label || matchedSub,
        suppliers: Array.isArray(pack.suppliers) ? pack.suppliers : [],
        equipment_suppliers: Array.isArray(pack.equipment_suppliers) ? pack.equipment_suppliers : [],
        backup_suppliers: Array.isArray(pack.backup_suppliers) ? pack.backup_suppliers : [],
        china_manufacturers: Array.isArray(pack.china_manufacturers) ? pack.china_manufacturers : [],
        source: "aethra_curated_library",
        policy: lib.policy,
      };
    }
  }

  return {
    matched: false,
    industry: null,
    subcategory: matchedSub,
    label: null,
    suppliers: [],
    equipment_suppliers: [],
    backup_suppliers: [],
    china_manufacturers: [],
    source: "aethra_curated_library",
    policy: lib.policy,
    note: "Keyword matched but pack missing — check supplyLibrary.json.",
  };
}

module.exports = { getCuratedLayer, loadLib };
