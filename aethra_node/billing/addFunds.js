"use strict";

const { createWalletTopupSession } = require("./walletTopup");

/**
 * Backwards-compatible alias used by existing API route:
 * POST /api/v1/billing/top-up-session
 */
async function createTopUpSession(userId, amountGbp) {
  return await createWalletTopupSession(userId, amountGbp);
}

module.exports = { createTopUpSession };

