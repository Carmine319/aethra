"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

const DIAGNOSTIC_CLOSE = [
  "Context (2 min): confirm current baseline and pressure points.",
  "Diagnosis (5 min): isolate leakage and quantify operational drag.",
  "Framing (3 min): map AETHRA execution pathway with controlled risk.",
  "Decision (3 min): present paid diagnostic scope, timeline, and deliverables.",
  "Close (2 min): secure proceed/not-now decision with a single next action."
];

function generateCallScript(context = {}) {
  const c = String(context.niche || "the target operation");
  return {
    structure: DIAGNOSTIC_CLOSE,
    close_line: `Based on this, the next step is a structured diagnostic for ${c}. It confirms whether scaling is warranted. Shall we proceed?`
  };
}

module.exports = { generateCallScript, DIAGNOSTIC_CLOSE };