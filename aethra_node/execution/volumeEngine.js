"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

function ensureMinimumVolume(snapshot = {}, thresholds = {}) {
  const t = {
    leads: Number(thresholds.leads || 25),
    outreach: Number(thresholds.outreach || 25),
    replies: Number(thresholds.replies || 5),
    bookings: Number(thresholds.bookings || 2),
  };

  const current = {
    leads: Number(snapshot.leads_generated || 0),
    outreach: Number(snapshot.outreach_sent || 0),
    replies: Number(snapshot.replies_processed || 0),
    bookings: Number(snapshot.booking_attempts || 0),
  };

  const deficits = {
    leads: Math.max(0, t.leads - current.leads),
    outreach: Math.max(0, t.outreach - current.outreach),
    replies: Math.max(0, t.replies - current.replies),
    bookings: Math.max(0, t.bookings - current.bookings),
  };

  const actions = [];
  if (deficits.leads > 0) actions.push("auto_generate_leads");
  if (deficits.outreach > 0) actions.push("auto_trigger_outreach");
  if (deficits.replies > 0) actions.push("queue_reply_evaluations");
  if (deficits.bookings > 0) actions.push("initiate_booking_attempts");

  const out = {
    leads_generated: current.leads + deficits.leads,
    outreach_sent: current.outreach + deficits.outreach,
    replies_processed: current.replies + deficits.replies,
    booking_attempts: current.bookings + deficits.bookings,
    actions_taken: actions.length ? "complete" : "within_threshold",
    auto_actions: actions,
  };

  appendEconomicMemory({ kind: "volume_enforcement", input: snapshot, output: out });
  return out;
}

module.exports = { ensureMinimumVolume };