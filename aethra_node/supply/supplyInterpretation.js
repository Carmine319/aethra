"use strict";

/**
 * Layer 3 — interpretation / execution stack (not raw directory export).
 */

function firstNamed(list, fallbackLabel) {
  const a = Array.isArray(list) ? list : [];
  if (!a.length) return { name: fallbackLabel, source: "none", detail: "Populate via Layer 2 or expand curated library." };
  const x = a[0];
  return {
    name: x.name || fallbackLabel,
    source: x.intel_source || "aethra_curated_library",
    type: x.type || "supplier",
    score: x.score,
    notes: x.notes || "",
  };
}

function interpretSupplyExecution(layer1, layer2) {
  const chem = layer1.suppliers || [];
  const eq = layer1.equipment_suppliers || [];
  const backup = layer1.backup_suppliers || [];
  const china = (layer2 && layer2.top_manufacturers_china) || layer1.china_manufacturers || [];

  const freshUk = (layer2 && layer2.top_suppliers_uk) || [];
  const fastSource = chem.length ? firstNamed(chem, "Primary chemical / consumables partner") : firstNamed(freshUk, "Regional supplier (verify)");

  let scalePrimary;
  if (eq.length) scalePrimary = firstNamed(eq, "Equipment bundle");
  else if (backup.length) scalePrimary = firstNamed(backup, "Backup / regional scale");
  else
    scalePrimary = {
      name: "Equipment or second-source supplier — add when repeat job tickets justify stock depth",
      source: "none",
      detail: "Use Layer 2 discovery or expand curated pack.",
    };

  const execution_stack = {
    supplier_fast_start: {
      role: "Fast start — chemicals & consumables",
      primary: fastSource,
      alternate_live: freshUk[0]
        ? { name: freshUk[0].name, intel_source: freshUk[0].intel_source || "google_places_text_search" }
        : null,
    },
    supplier_scale: {
      role: "Scale — equipment & fulfilment depth",
      primary: scalePrimary,
    },
    supplier_margin_optimisation: {
      role: "Margin optimisation — bulk / OEM",
      primary: firstNamed(china, "Contract or OEM manufacturer (audit first)"),
    },
  };

  const supplier_roles = {
    chemicals: takeThree(chem.length ? chem : freshUk),
    equipment: takeThree(eq),
    backup_supplier: takeThree(backup),
  };

  return {
    execution_stack,
    supplier_roles,
    recommended: [
      {
        action: "start_here",
        detail: `Lead with ${execution_stack.supplier_fast_start.primary.name} — lock SDS, MOQ, and payment terms before first job.`,
      },
      {
        action: "switch_at_gbp_monthly",
        threshold: 2000,
        detail:
          "At approximately £2k/month consumables throughput, consolidate orders and negotiate tier pricing or regional backup.",
      },
      {
        action: "optimise_at_gbp_monthly",
        threshold: 10000,
        detail:
          "At approximately £10k/month, evaluate OEM / pallet imports or reformulation — only after delivery quality is stable.",
      },
    ],
    layer3_note:
      "Execution stack is ordered for cash efficiency: prove job economics domestically before offshore commitment.",
  };
}

function takeThree(arr) {
  return (Array.isArray(arr) ? arr : []).slice(0, 3).map((r) => ({
    name: r.name,
    location: r.location,
    type: r.type,
    score: r.score,
    price_signal: r.price_signal,
    intel_source: r.intel_source || "aethra_curated_library",
  }));
}

module.exports = { interpretSupplyExecution };
