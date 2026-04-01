"use strict";

function generateReply(type, context = {}) {
  const offer = String(context.offer || "scoped diagnostic").slice(0, 200);
  const niche = String(context.niche || "operators in your segment").slice(0, 120);

  const templates = {
    price_interest: `Happy to share — this is a structured ${offer} designed to surface whether there is a real cost leak or risk exposure.

If useful, a 15-minute walkthrough is enough to decide if it is worth pursuing.`,

    ready_to_book: `Perfect — use the booking link below when ready.

The session stays outcome-driven and time-boxed.`,

    positive: `Quick context: AETHRA helps ${niche} turn inefficiencies into measurable improvements.

If a short exploration makes sense, say the word and we will line up one focused touch.`,

    delay: `No problem — when would be a better window to revisit?

The thread stays open on your timing.`,

    negative: `Understood — appreciate the clarity.

If priorities shift later, reconnect anytime.`,

    unclear: `Thanks for the note. To point the next step correctly: is timing, scope, or budget the main question right now?

One line is enough — then we match the response to that.`,
  };

  return templates[type] || templates.unclear;
}

module.exports = { generateReply };
