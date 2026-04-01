"use strict";

const DIAGNOSTIC_CLOSE_LINE = `Based on this, the next step is a structured diagnostic.

It will confirm whether this is worth scaling.

Shall we proceed with that?`;

/**
 * 15-minute close structure — context → diagnosis → frame → decision → close.
 */
function generateCallScript(context) {
  void context;
  return [
    "1. Context (2 min):",
    "Understand current situation and pain points.",

    "2. Diagnosis (5 min):",
    "Identify inefficiencies or missed opportunities.",

    "3. Framing (3 min):",
    "Explain how AETHRA approach solves this with minimal risk.",

    "4. Decision (3 min):",
    "Offer structured next step (paid diagnostic or execution).",

    "5. Close (2 min):",
    "Confirm action: proceed / not now",
  ];
}

function getDiagnosticCloseLine() {
  return DIAGNOSTIC_CLOSE_LINE;
}

module.exports = {
  generateCallScript,
  getDiagnosticCloseLine,
  DIAGNOSTIC_CLOSE_LINE,
};
