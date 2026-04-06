"use strict";

function notifyStripeRevenue(amountGbp, source, meta) {
  try {
    const { recordVerifiedRevenue } = require("./engine");
    recordVerifiedRevenue(amountGbp, source, meta, 1);
  } catch {
    /* optional */
  }
}

module.exports = { notifyStripeRevenue };
