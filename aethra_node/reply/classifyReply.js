"use strict";

/**
 * Intent classification for revenue conversion — not open-ended chat labelling.
 */
async function classifyReply(message) {
  const lower = String(message || "").toLowerCase();
  if (!lower.trim()) return "unclear";

  if (/\bnot interested\b|unsubscribe|stop emailing|no thanks\b/i.test(lower)) return "negative";
  if (/\b(price|cost|how much|fee|quote|budget)\b/i.test(lower)) return "price_interest";
  if (/\b(call|meeting|schedule|book|calendar|zoom|teams|when can we)\b/i.test(lower)) return "ready_to_book";
  if (/\b(later|busy|next quarter|circle back|not now)\b/i.test(lower)) return "delay";
  if (/\b(tell me more|interested|sounds good|yes|let'?s|more detail)\b/i.test(lower)) return "positive";

  return "unclear";
}

module.exports = { classifyReply };
