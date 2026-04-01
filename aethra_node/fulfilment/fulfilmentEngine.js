"use strict";

const { findSuppliers } = require("../supplier/supplierEngine");

async function buildFulfilmentPlan(nicheEnvelope) {
  const niche = String((nicheEnvelope && nicheEnvelope.selected && nicheEnvelope.selected.niche) || "operations services");
  const supplierPack = await findSuppliers(niche, { limit: 6 });
  const supplierRows = Array.isArray(supplierPack.suppliers) ? supplierPack.suppliers : [];
  const supplier = supplierRows[0] ? String(supplierRows[0].name || supplierRows[0].supplier || "Preferred supplier") : "Preferred supplier";

  return {
    supplier,
    tools: [
      "Structured diagnostic checklist",
      "Scheduling and dispatch board",
      "QA completion template"
    ],
    steps: [
      "Confirm scope and pass/fail criteria",
      "Dispatch supplier and execute workflow",
      "Capture completion evidence and margin delta",
      "Publish post-delivery report for proof"
    ],
    time_to_complete: "48-72 hours",
    cost: "Low complexity / outsourced-first"
  };
}

module.exports = { buildFulfilmentPlan };