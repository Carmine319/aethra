"use strict";

const { getCuratedLayer } = require("./supplyLibrary");
const { runLiveConnectorSweep } = require("./supplyConnectors");
const { interpretSupplyExecution } = require("./supplyInterpretation");

function parseLeadWeeks(leadTime) {
  const s = String(leadTime || "").toLowerCase();
  if (/same day|1[\s-]*2 day|2[\s-]*3 day|^\d[\s-]*\d day/.test(s)) return 1;
  if (/week/.test(s)) {
    const m = s.match(/(\d+)[\s-]*(\d+)?\s*week/);
    if (m) return Number(m[2] || m[1]) || 2;
    return 2;
  }
  if (/day/.test(s)) return 1;
  return null;
}

function slug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 28);
}

function curatedToLegacy(r, i, prefix) {
  return {
    supplier_id: `${prefix}_${i}_${slug(r.name)}`,
    legal_name: r.name,
    region: r.location,
    category_tags: [String(r.type || "supplier").replace(/\s+/g, "_"), "aethra_curated_library"],
    fit_score_0_100: Math.min(96, Math.max(40, Math.round(Number(r.score || 7) * 10))),
    moq_band: String(r.moq || "verify"),
    lead_time_weeks: parseLeadWeeks(r.lead_time),
    verification: "curated_starting_intel_verify_before_po",
    intel_source: "aethra_curated_library",
    notes: [r.notes, r.contact && `Contact: ${r.contact}`, r.price_signal && `Price signal: ${r.price_signal}`]
      .filter(Boolean)
      .join(" \u00b7 "),
  };
}

function connectorRowToLegacy(r, i, prefix) {
  return {
    supplier_id: `${prefix}_${i}_${slug(r.name)}`,
    legal_name: r.name,
    region: r.location,
    category_tags: [String(r.type || "listing").replace(/\s+/g, "_"), "connector_live_or_template"],
    fit_score_0_100: Math.min(96, Math.max(40, Math.round(Number(r.score || 7.5) * 10))),
    moq_band: String(r.moq || "verify"),
    lead_time_weeks: null,
    verification: "verify_listing_before_po",
    intel_source: r.intel_source || "connector",
    notes: r.notes || "",
  };
}

function buildLegacyRows(layer1, layer2, limit) {
  const cap = Math.min(12, Math.max(3, Number(limit) || 5));
  const rows = [];
  let i = 0;
  const pushCur = (arr, prefix) => {
    for (const r of arr) {
      if (rows.length >= cap) return;
      rows.push(curatedToLegacy(r, i++, prefix));
    }
  };
  pushCur(layer1.suppliers || [], "cur");
  pushCur(layer1.equipment_suppliers || [], "eq");
  pushCur(layer1.backup_suppliers || [], "bk");

  for (const r of layer2.top_suppliers_uk || []) {
    if (rows.length >= cap) break;
    rows.push(connectorRowToLegacy(r, i++, "uk"));
  }
  for (const r of layer1.china_manufacturers || []) {
    if (rows.length >= cap) break;
    rows.push(curatedToLegacy(r, i++, "cn"));
  }
  if (!rows.length) {
    rows.push({
      supplier_id: "placeholder_guidance",
      legal_name: "No curated match — run connector sweep or widen product description",
      region: "—",
      category_tags: ["guidance"],
      fit_score_0_100: 50,
      moq_band: "—",
      lead_time_weeks: null,
      verification: "n/a",
      intel_source: "system",
      notes: "Describe the niche (e.g. ice machine cleaning); expand supplyLibrary keywords or set GOOGLE_PLACES_API_KEY.",
    });
  }
  return rows.slice(0, cap);
}

/**
 * Full three-layer supply access + legacy supplier rows for existing UI.
 */
async function resolveSupplyAccess(productContext, options = {}) {
  const layer1 = getCuratedLayer(productContext);
  const layer2 = await runLiveConnectorSweep(productContext, layer1);
  const layer3 = interpretSupplyExecution(layer1, layer2);

  const liveOk = (layer2.connector_manifest || []).some((c) => c.status === "ok");
  const mode = liveOk ? "hybrid_curated_plus_live_places" : "curated_plus_connectors_ready";

  const suppliers = buildLegacyRows(layer1, layer2, options.limit);

  return {
    suppliers,
    supply_access: {
      layer1_curated: layer1,
      layer2_connectors: layer2,
      layer3_interpretation: layer3,
    },
    mode,
    query_digest: String(productContext || "").slice(0, 120),
    policy:
      "fabrication_policy: no invented URLs; curated rows are execution shortcuts — operator verifies every supplier before PO.",
  };
}

module.exports = { resolveSupplyAccess, buildLegacyRows };
