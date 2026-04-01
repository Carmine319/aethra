"use strict";

function resolveFriction(friction = {}, context = {}) {
  const f = String(friction.friction_type || "none");

  if (f === "no_replies") {
    return {
      action: "rewrite_outreach",
      patch: "tighten_subject_and_outcome_specificity",
      next_offer: context.current_offer || null,
    };
  }
  if (f === "no_bookings") {
    return {
      action: "adjust_offer",
      patch: "lower_entry_offer_to_paid_diagnostic",
      next_offer: "GBP 49 structured diagnostic",
    };
  }
  if (f === "delivery_complexity") {
    return {
      action: "simplify_fulfilment",
      patch: "outsource_and_reduce_steps",
      next_offer: context.current_offer || null,
    };
  }
  if (f === "price_resistance") {
    return {
      action: "introduce_lower_entry_offer",
      patch: "split_offer_into_diagnostic_then_execution",
      next_offer: "GBP 49 diagnostic entry",
    };
  }

  return { action: "none", patch: "continue_current_cycle", next_offer: context.current_offer || null };
}

module.exports = { resolveFriction };