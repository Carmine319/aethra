import crypto from "crypto";
import { createTrustOriginReceipt } from "../../trustorigin/integration";
import { logExternalEvent } from "./audit.bridge";
import { resolveLegalEntity } from "./identity.mapping";

function sha256(obj: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(obj), "utf8").digest("hex");
}

/**
 * Evidence-grade record + TrustOrigin receipt bridge (cryptographic lineage).
 */
export function generateEvidence(action: Record<string, unknown>) {
  const entity = resolveLegalEntity();
  const payload = { ...action, entity, ts: Date.now() };
  const contentHash = sha256(payload);

  const receipt = createTrustOriginReceipt({
    venture_id: String(action.venture_id || action.correlation_id || "external_action"),
    business_record: { legal_entity: entity, action_type: action.type || "external" },
    execution_proof: { content_hash: contentHash, payload },
    revenue_snapshot: { amount: Number(action.amount || 0), currency: action.currency || "GBP" },
    mutation_history: [{ action: "external_evidence", content_hash: contentHash, ts: Date.now() }],
    previous_hash: String(action.previous_hash || "genesis"),
  });

  logExternalEvent({
    event: "evidence_generated",
    content_hash: contentHash,
    trustorigin_receipt_id: receipt.receipt_id,
    verification_hash: receipt.verification_hash,
  });

  return {
    hash: contentHash,
    timestamp: Date.now(),
    compliant: true,
    legal_entity: entity,
    trustorigin: receipt,
  };
}
