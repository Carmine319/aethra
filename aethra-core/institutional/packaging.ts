import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createTrustOriginReceipt, type TrustOriginReceipt } from "../trustorigin/integration";

export type VentureOutcomeInput = {
  venture_id: string;
  venture_name?: string;
  revenue_report: Record<string, unknown>;
  growth_trajectory: Record<string, unknown>;
  execution_log: Array<Record<string, unknown>>;
  mutation_history: Array<Record<string, unknown>>;
  optimisation_log: Array<Record<string, unknown>>;
  previous_hash?: string;
};

export type RevenueDossier = {
  format: "Revenue Dossier";
  generated_at: number;
  venture_id: string;
  venture_name: string;
  revenue_report: Record<string, unknown>;
  growth_trajectory: Record<string, unknown>;
  execution_log: Array<Record<string, unknown>>;
  trustorigin_verification: TrustOriginReceipt;
  trustorigin_core_asset: {
    hashed_execution_timeline: string;
    revenue_proof_snapshot: string;
    mutation_history_hash: string;
    optimisation_log_hash: string;
    verification_hash: string;
    institutional_pdf_path: string;
  };
};

function hash(data: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(data), "utf8").digest("hex");
}

function writeInstitutionalPdfLikeRecord(payload: unknown, verificationHash: string): string {
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

export function packageOutcome(venture: VentureOutcomeInput): RevenueDossier {
  const executionTimelineHash = hash(venture.execution_log || []);
  const revenueSnapshotHash = hash(venture.revenue_report || {});
  const mutationHistoryHash = hash(venture.mutation_history || []);
  const optimisationLogHash = hash(venture.optimisation_log || []);

  const trustoriginReceipt = createTrustOriginReceipt({
    venture_id: String(venture.venture_id || "venture_unknown"),
    business_record: {
      venture_name: String(venture.venture_name || venture.venture_id || "Unnamed venture"),
      growth_trajectory: venture.growth_trajectory || {},
    },
    execution_proof: {
      execution_log_hash: executionTimelineHash,
      optimisation_log_hash: optimisationLogHash,
    },
    revenue_snapshot: venture.revenue_report || {},
    mutation_history: venture.mutation_history || [],
    previous_hash: String(venture.previous_hash || "genesis"),
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
    venture_id: venture.venture_id,
    venture_name: venture.venture_name || venture.venture_id,
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
    venture_id: String(venture.venture_id || "venture_unknown"),
    venture_name: String(venture.venture_name || venture.venture_id || "Unnamed venture"),
    revenue_report: venture.revenue_report || {},
    growth_trajectory: venture.growth_trajectory || {},
    execution_log: Array.isArray(venture.execution_log) ? venture.execution_log : [],
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
