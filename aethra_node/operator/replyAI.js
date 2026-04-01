"use strict";

/**
 * Lightweight classifier — replace with model API when wired.
 */
function classifyReply(message) {
  const m = String(message || "").toLowerCase();
  if (!m.trim()) return { category: "ignore", confidence: 0.9 };

  const interested =
    /\b(yes|yeah|sure|interested|sounds good|let'?s|book|call|schedule|pilot|when can we)\b/.test(m);
  const objection =
    /\b(too expensive|not now|budget|no time|not interested|stop|unsubscribe|busy|later year)\b/.test(m);
  const follow =
    /\b(maybe|send more|tell me more|what'?s the price|how much|details|info|question)\b/.test(m);

  if (objection && !interested) return { category: "objection", confidence: 0.78 };
  if (interested) return { category: "interested", confidence: 0.82 };
  if (follow) return { category: "follow_up", confidence: 0.7 };
  if (m.length < 8) return { category: "ignore", confidence: 0.55 };
  return { category: "follow_up", confidence: 0.5 };
}

function generateResponse(category) {
  const map = {
    interested:
      "Thanks — here are two 20-minute slots this week (UK). If neither works, propose one window and we’ll confirm with a one-page scope.",
    objection:
      "Understood. If cost or timing is the block: we can scope a smaller paid pilot with a fixed ceiling. If it is not a priority, I’ll close the thread — no further follow-ups.",
    ignore: "Noted. I’ll stand down on this thread.",
    follow_up:
      "Happy to go deeper: one paragraph on scope, one line on price band, and what “good” looks like in 14 days. Which of those three is most useful first?",
  };
  return map[category] || map.follow_up;
}

function buildReplyDraft(lead, offerSummary, inboundText, classification) {
  const who = String(lead?.name || "there").split(" ")[0];
  const offer = String(offerSummary || "the scoped pilot").slice(0, 140);
  const cat = classification?.category || "follow_up";
  const base = generateResponse(cat);
  const mirror = String(inboundText || "").slice(0, 200).replace(/\s+/g, " ");
  return (
    `${who},\n\n` +
    `Re your note (“${mirror}”): ${base}\n\n` +
    `Context: we’re positioning ${offer} for operators like you — one channel, one KPI, written economics.\n\n` +
    `Best,\nAETHRA operator`
  );
}

module.exports = { classifyReply, generateResponse, buildReplyDraft };

