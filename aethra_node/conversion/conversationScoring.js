"use strict";

/**
 * Conversation quality — clarity / intent / friction proxy via lexical signals.
 */
function scoreConversation(thread) {
  const lines = Array.isArray(thread) ? thread.map((t) => String(t || "")) : [];
  const score = scoreThreadLines(lines);
  return enrichScorePayload(score);
}

function scoreThreadLines(lines) {
  let score = 0;
  const text = lines.join(" ").toLowerCase();

  if (text.includes("price") || text.includes("cost")) score += 20;
  if (text.includes("call") || text.includes("meeting")) score += 25;
  if (text.includes("interested")) score += 30;
  if (text.includes("not interested")) score -= 40;
  if (text.includes("later")) score -= 10;

  if (lines.length > 2) score += 10;

  return score;
}

function enrichScorePayload(score) {
  const quality = score > 60 ? "high" : score > 30 ? "medium" : "low";
  const conversion_likelihood =
    score > 60 ? "strong" : score > 30 ? "moderate" : "weak";
  const next_action =
    score > 60
      ? "push_to_booking"
      : score > 30
        ? "nurture_and_qualify"
        : "reframe_or_pause";

  const next_action_label =
    score > 60
      ? "Push to booking"
      : score > 30
        ? "Nurture and qualify"
        : "Reframe or pause";

  return {
    score,
    quality,
    conversion_likelihood,
    next_action,
    next_action_label,
  };
}

module.exports = { scoreConversation, scoreThreadLines, enrichScorePayload };
