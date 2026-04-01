"use strict";

function analyseGap(opportunity) {
  const op = opportunity && typeof opportunity === "object" ? opportunity : {};
  const name = String(op.name || op.idea || "opportunity");
  return {
    strengths: ["existing demand", "clear monetisation"],
    weaknesses: ["generic positioning", "slow fulfilment in competitors"],
    missingValue: ["proof-first messaging", "faster onboarding", "clear compliance evidence"],
    improvementStrategy: [
      `Differentiate ${name} via explicit outcomes and proof artifacts`,
      "Compress onboarding to same-day start",
      "Add transparent reporting and post-delivery verification",
    ],
  };
}

module.exports = { analyseGap };
