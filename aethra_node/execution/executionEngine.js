"use strict";

const crypto = require("crypto");
const { findSuppliers } = require("../supplier/supplierEngine");
const { generateOutreachPlan } = require("../outreach/outreachEngine");
const { sendOutreachBatch } = require("../outreach/outreachSender");
const { createCRMEntries } = require("../crm/crmEngine");
const { normalizePlan, assertExecutionAllowed } = require("../saas/billingEngine");
const { getUserPlan } = require("../billing/planStore");

/**
 * Real execution mode: suppliers → outreach plan → CRM rows → batch send (live or simulated).
 */
async function runExecutionMode(input = {}) {
  const idea = String(input.idea || input.text || input.input || "").trim();
  if (!idea) {
    const e = new Error("missing_idea");
    e.code = "MISSING_IDEA";
    throw e;
  }

  const userId = input.user_id || input.userId || input.userKey || null;
  const chosenPlan = input.plan || process.env.AETHRA_PLAN || (userId ? getUserPlan(userId) : "free");
  const plan = normalizePlan(chosenPlan);
  assertExecutionAllowed(plan);

  const ventureId = crypto.randomUUID();

  const suppliers = await findSuppliers(idea, { limit: 8 });
  const outreachPlan = await generateOutreachPlan(idea, suppliers);
  const crm = createCRMEntries(ventureId, outreachPlan.targets);
  const dispatch = await sendOutreachBatch(outreachPlan);

  return {
    ok: true,
    venture_id: ventureId,
    status: "execution_started",
    suppliers,
    outreach: outreachPlan,
    crm,
    dispatch,
  };
}

module.exports = { runExecutionMode };
