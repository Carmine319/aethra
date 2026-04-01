"use strict";

const crypto = require("crypto");

function hash(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data), "utf8").digest("hex");
}

function createTrustOriginReceipt(input) {
  const safe = input && typeof input === "object" ? input : {};
  const payload = {
    venture_id: safe.venture_id,
    hashed_business_record: hash(safe.business_record || {}),
    timestamped_execution_proof: { ts: Date.now(), hash: hash(safe.execution_proof || {}) },
    revenue_proof_snapshot: hash(safe.revenue_snapshot || {}),
    mutation_history_hash: hash(safe.mutation_history || []),
    previous_hash: String(safe.previous_hash || "genesis"),
  };
  const verificationHash = hash(payload);
  const short = verificationHash.slice(0, 12);
  return {
    verification_hash: verificationHash,
    lineage_chain: [String(payload.previous_hash), verificationHash],
    public_verification_endpoint: `/core/trustorigin/${short}`,
    timestamp: Date.now(),
    receipt_id: `TRUSTORIGIN-${short}`,
  };
}

function trustLoop(ventureReceipt) {
  return {
    stages: [
      "user builds venture",
      "aethra executes",
      "trustorigin verifies",
      "result published",
      "new users attracted",
    ],
    signal: "Trust -> adoption -> data -> intelligence -> more trust",
    receipt: ventureReceipt,
  };
}

module.exports = { createTrustOriginReceipt, trustLoop };
