"use strict";

const COMPLIANCE_POLICY = {
  outcome_guarantee_disclaimer:
    "AETHRA does not guarantee financial, operational, or strategic outcomes.",
  trustorigin_scope_disclaimer:
    "TrustOrigin verification records execution artifacts and integrity hashes, and does not verify factual truth, legal validity, or commercial merit.",
  system_scope_statement:
    "The system records execution events, workflow mutations, and optimisation activity for auditability only.",
};

function getRegulatorSafeLanguage() {
  return {
    tone: "neutral",
    posture: "non-adjudicative",
    claims: [
      "Execution records are provided for transparency and audit support.",
      "Recorded artifacts should be interpreted alongside independent commercial judgement.",
      "No statement in a dossier constitutes legal, financial, or regulatory advice.",
    ],
    disclaimers: COMPLIANCE_POLICY,
  };
}

module.exports = { COMPLIANCE_POLICY, getRegulatorSafeLanguage };
