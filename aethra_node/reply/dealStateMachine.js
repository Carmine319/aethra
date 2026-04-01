"use strict";

const STATES = {
  NEW: "new",
  CONTACTED: "contacted",
  ENGAGED: "engaged",
  QUALIFIED: "qualified",
  BOOKED: "booked",
  OFFER_SENT: "offer_sent",
  CLOSED: "closed",
  LOST: "lost",
  TESTIMONIAL: "testimonial",
  ARCHIVED: "archived",
};

/**
 * Controlled deal lifecycle — each transition is explicit (signal from classification layer).
 */
function nextState(current, signal) {
  const c = String(current || STATES.NEW).toLowerCase();
  const s = String(signal || "").toLowerCase();

  const transitions = {
    [STATES.NEW]: { reply: STATES.ENGAGED, negative: STATES.LOST },
    [STATES.CONTACTED]: { reply: STATES.ENGAGED, negative: STATES.LOST },
    [STATES.ENGAGED]: {
      positive: STATES.QUALIFIED,
      unclear: STATES.ENGAGED,
      negative: STATES.LOST,
      reply: STATES.ENGAGED,
    },
    [STATES.QUALIFIED]: {
      book: STATES.BOOKED,
      price_pushback: STATES.QUALIFIED,
      positive: STATES.QUALIFIED,
      negative: STATES.LOST,
      unclear: STATES.QUALIFIED,
    },
    [STATES.BOOKED]: { attended: STATES.OFFER_SENT, no_show: STATES.ENGAGED },
    [STATES.OFFER_SENT]: { accepted: STATES.CLOSED, rejected: STATES.LOST },
    [STATES.CLOSED]: { delivered: STATES.TESTIMONIAL },
    [STATES.TESTIMONIAL]: { archive: STATES.ARCHIVED },
    [STATES.LOST]: { archive: STATES.ARCHIVED },
  };

  const row = transitions[c];
  if (!row || !s) return c;
  return row[s] != null ? row[s] : c;
}

module.exports = { STATES, nextState };
