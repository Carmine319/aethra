"use strict";

const crm = require("./crm");

/**
 * Adds execution-mode leads to the live CRM pipeline (in-memory).
 * Mutates each target with crm_id for downstream email logging.
 */
function createCRMEntries(ventureId, targets) {
  const rows = [];
  const list = Array.isArray(targets) ? targets : [];
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    const row = crm.addLead({
      id: t.lead_id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      location: t.location,
      stage: "contacted",
      venture_id: ventureId,
      exec_source: "execution_mode",
    });
    t.crm_id = row.id;
    rows.push({
      id: row.id,
      venture_id: ventureId,
      email: row.email,
      stage: row.stage,
      next_action: "await_reply",
    });
  }
  return rows;
}

module.exports = { createCRMEntries };
