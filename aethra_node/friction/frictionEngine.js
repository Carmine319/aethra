"use strict";

function detectFriction(input = {}) {
  const replyRate = Number(input.reply_rate || 0);
  const bookings = Number(input.bookings || 0);
  const failedPayments = Number(input.failed_payments || 0);
  const complexity = Number(input.fulfilment_complexity || 0);

  if (failedPayments > 0) {
    return { friction_type: "failed_payments", severity: "high", fix: "retry_checkout_and_reduce_payment_steps" };
  }
  if (replyRate <= 1) {
    return { friction_type: "no_replies", severity: "high", fix: "rewrite_outreach_and_refresh_lead_batch" };
  }
  if (bookings <= 0 && replyRate > 1) {
    return { friction_type: "no_bookings", severity: "medium", fix: "adjust_offer_and_booking_cta" };
  }
  if (complexity > 70) {
    return { friction_type: "delivery_complexity", severity: "medium", fix: "simplify_fulfilment_model" };
  }
  return { friction_type: "none", severity: "low", fix: "continue" };
}

module.exports = { detectFriction };