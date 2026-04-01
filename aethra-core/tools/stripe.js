"use strict";

async function chargeWithStripe(payload = {}) {
  try {
    const stripe = require("../../aethra_node/payments/stripe.js");
    if (typeof stripe.createCheckoutSession === "function") {
      return await stripe.createCheckoutSession(payload);
    }
  } catch {}
  return { ok: false, fallback: true, provider: "stripe_unavailable" };
}

module.exports = { chargeWithStripe };