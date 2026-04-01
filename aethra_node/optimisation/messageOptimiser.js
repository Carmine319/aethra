"use strict";

/**
 * Rewrite weak outreach copy from aggregate performance (reply_rate %).
 */
function optimiseMessage(message, performance) {
  const perf = performance && typeof performance === "object" ? performance : {};
  const replyRate = Number(perf.reply_rate) || 0;
  const base = String(message || "").trim() || "this area";

  if (replyRate < 10) {
    return `Quick question — are you currently handling ${base} internally or outsourcing it?

We've seen operators improve this significantly with minimal changes.`;
  }

  if (replyRate < 20) {
    return `${base}

Worth a quick 10–15 minute check to see if there's anything being missed?`;
  }

  return base;
}

module.exports = { optimiseMessage };
