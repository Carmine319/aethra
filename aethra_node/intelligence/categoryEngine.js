"use strict";

/**
 * Category / angle creation — reframes generic labels into monetisable positioning.
 * Deterministic templates, not hallucinated market data.
 */
function createNewAngle(idea) {
  const raw = String(idea || "").trim();
  const lower = raw.toLowerCase();
  const prior = raw.slice(0, 80) || "unspecified offer";

  let new_positioning = "Outcome-led operator service with written economics";
  let new_niche = "Mid-market operators with one primary acquisition channel";
  let monetisation_logic =
    "Fixed-scope pilot → measurable KPI in 14 days → expand retainer only if KPI clears";

  if (/\bclean|hygiene|facilit|janitorial\b/.test(lower)) {
    new_positioning = "Hygiene compliance programme for food-facing sites";
    new_niche = "Independent cafés and QSR under EHO pressure — not generic office cleaning";
    monetisation_logic = "Monthly compliance checklist + emergency callout tier; pilot on one site line";
  } else if (/saas|software|app\b/.test(lower)) {
    new_positioning = "Workflow system that replaces spreadsheet chaos for one department";
    new_niche = "50–200 seat firms already paying for adjacent tools";
    monetisation_logic = "Seat-based annual with onboarding fee; kill features that don't touch ROI metric";
  } else if (/shop|retail|e-?commerce|store\b/.test(lower)) {
    new_positioning = "Conversion and basket recovery layer for existing traffic";
    new_niche = "Merchants with steady sessions but leaky checkout";
    monetisation_logic = "Performance-linked fee on recovered revenue after 30-day baseline";
  } else if (/consult|agency|studio\b/.test(lower)) {
    new_positioning = "Narrow wedge offer with delivery ceiling and referral clause";
    new_niche = "Buyers who already have budget line for the pain (not education market)";
    monetisation_logic = "Deposit + milestone invoice; no open-ended time blocks";
  }

  return {
    prior_frame: prior,
    new_positioning,
    new_niche,
    monetisation_logic,
    confidence: 0.55,
    note: "Template reframe — validate wording with 3 customer interviews before scaling copy.",
  };
}

module.exports = { createNewAngle };
