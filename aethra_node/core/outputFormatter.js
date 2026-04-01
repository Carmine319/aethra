"use strict";

/**
 * Institutional briefing wrapper — declarative framing for surfaced content.
 */
function formatOutput(section, content) {
  const head = String(section || "Briefing").trim();
  const body = String(content || "").trim();

  return `${head}

${body}

AETHRA operates on structured decision logic.
All outputs are derived from measurable signals.`;
}

module.exports = { formatOutput };
