"use strict";

function generateProofAssets(input = {}) {
  const niche = String(input.niche || "target operations");
  const outcome = String(input.outcome || "reduced leakage");
  const timeline = String(input.timeline || "7 days");

  return {
    case_study: `Case study: ${niche} operation executed structured diagnostic and moved from uncertainty to controlled execution in ${timeline}.`,
    before_after: `Before: untracked inefficiency and reactive spend. After: validated pathway, controlled fulfilment, and ${outcome}.`,
    testimonial: `"AETHRA converted uncertainty into a decision-ready execution plan and measurable operational gain."`
  };
}

module.exports = { generateProofAssets };