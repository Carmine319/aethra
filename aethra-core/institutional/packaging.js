"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { createTrustOriginReceipt } = require("../trustorigin/integration.js");

function hash(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data), "utf8").digest("hex");
}

function writeInstitutionalPdfLikeRecord(payload, verificationHash) {
  const logsDir = path.join(__dirname, "..", "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const pdfPath = path.join(logsDir, `institutional_dossier_${verificationHash.slice(0, 12)}.pdf.txt`);
  const content =
    "Institutional Dossier\n" +
    `Verification Hash: ${verificationHash}\n` +
    `Generated At: ${new Date().toISOString()}\n\n` +
    JSON.stringify(payload, null, 2) +
    "\n";
  fs.writeFileSync(pdfPath, content, "utf8");
  return pdfPath;
}

function packageOutcome(venture) {
  const safe = venture && typeof venture === "object" ? venture : {};
  const executionTimelineHash = hash(safe.execution_log || []);
  const revenueSnapshotHash = hash(safe.revenue_report || {});
  const mutationHistoryHash = hash(safe.mutation_history || []);
  const optimisationLogHash = hash(safe.optimisation_log || []);

  const trustoriginReceipt = createTrustOriginReceipt({
    venture_id: String(safe.venture_id || "venture_unknown"),
    business_record: {
      venture_name: String(safe.venture_name || safe.venture_id || "Unnamed venture"),
      growth_trajectory: safe.growth_trajectory || {},
    },
    execution_proof: {
      execution_log_hash: executionTimelineHash,
      optimisation_log_hash: optimisationLogHash,
    },
    revenue_snapshot: safe.revenue_report || {},
    mutation_history: safe.mutation_history || [],
    previous_hash: String(safe.previous_hash || "genesis"),
  });

  const verificationHash = hash({
    trustorigin_receipt: trustoriginReceipt.verification_hash,
    execution_timeline_hash: executionTimelineHash,
    revenue_snapshot_hash: revenueSnapshotHash,
    mutation_history_hash: mutationHistoryHash,
    optimisation_log_hash: optimisationLogHash,
  });

  const institutionalPayload = {
    position: "Independent, tamper-evident execution record",
    venture_id: safe.venture_id,
    venture_name: safe.venture_name || safe.venture_id,
    hashed_execution_timeline: executionTimelineHash,
    revenue_proof_snapshot: revenueSnapshotHash,
    mutation_history_hash: mutationHistoryHash,
    optimisation_log_hash: optimisationLogHash,
    trustorigin_receipt: trustoriginReceipt,
    verification_hash: verificationHash,
  };

  const institutionalPdfPath = writeInstitutionalPdfLikeRecord(institutionalPayload, verificationHash);

  return {
    format: "Revenue Dossier",
    generated_at: Date.now(),
    venture_id: String(safe.venture_id || "venture_unknown"),
    venture_name: String(safe.venture_name || safe.venture_id || "Unnamed venture"),
    revenue_report: safe.revenue_report || {},
    growth_trajectory: safe.growth_trajectory || {},
    execution_log: Array.isArray(safe.execution_log) ? safe.execution_log : [],
    trustorigin_verification: trustoriginReceipt,
    trustorigin_core_asset: {
      hashed_execution_timeline: executionTimelineHash,
      revenue_proof_snapshot: revenueSnapshotHash,
      mutation_history_hash: mutationHistoryHash,
      optimisation_log_hash: optimisationLogHash,
      verification_hash: verificationHash,
      institutional_pdf_path: institutionalPdfPath,
    },
  };
}

module.exports = { packageOutcome };
