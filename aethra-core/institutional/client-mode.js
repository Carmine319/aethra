"use strict";

const { assertPrivateOperatorMode } = require("./operator.js");
const { packageOutcome } = require("./packaging.js");

async function runClientExecutionMode(request, executeInternally) {
  assertPrivateOperatorMode();
  const internalResult = await executeInternally(request);
  const dossier = packageOutcome({
    venture_id: internalResult.venture_id,
    venture_name: internalResult.venture_name || request.client_name || request.client_id,
    revenue_report: internalResult.revenue_report || {},
    growth_trajectory: internalResult.growth_trajectory || {},
    execution_log: internalResult.execution_log || [],
    mutation_history: internalResult.mutation_history || [],
    optimisation_log: internalResult.optimisation_log || [],
    previous_hash: internalResult.previous_hash,
  });
  return {
    mode: "controlled_internal_execution",
    direct_system_access: false,
    request,
    dossier,
  };
}

module.exports = { runClientExecutionMode };
