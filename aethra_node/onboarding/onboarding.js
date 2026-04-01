"use strict";

const { listPlansForOnboarding } = require("../saas/billingEngine");

/**
 * Server-side onboarding description — UI drives the flow; this stays the contract.
 */
function getOnboardingDefinition() {
  return {
    version: 1,
    steps: require("./onboardingSteps.json"),
    flow_summary: [
      "Landing",
      "Onboarding",
      "Run AETHRA",
      "Execution plan",
      "Operator mode",
      "CRM + outreach",
      "Portfolio",
      "Revenue tracking",
    ],
    plans: listPlansForOnboarding(),
  };
}

module.exports = { getOnboardingDefinition };
