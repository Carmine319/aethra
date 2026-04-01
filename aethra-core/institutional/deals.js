"use strict";

const { createLicenceOffer } = require("./licensing.js");

function generateDeal(target = "SME") {
  return {
    target,
    steps: [
      {
        step: 1,
        action: "identify_target",
        objective: `Identify ${target} with high-friction execution bottlenecks.`,
      },
      {
        step: 2,
        action: "present_case_study",
        objective: "Present internal case study with TrustOrigin-backed execution proof.",
      },
      {
        step: 3,
        action: "offer_pilot",
        objective: "Offer 90-day pilot at GBP 5000 with controlled delivery.",
      },
      {
        step: 4,
        action: "convert_to_licence",
        objective: "Convert validated pilot to annual licence under controlled access terms.",
      },
    ],
    pilot_offer_gbp: 5000,
    conversion_goal: "pilot_to_licence",
    follow_on_licence: createLicenceOffer("tier_2_single_domain"),
  };
}

module.exports = { generateDeal };
