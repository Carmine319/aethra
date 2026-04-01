import crypto from "crypto";

export type TrustOriginReceipt = {
  verification_hash: string;
  lineage_chain: string[];
  public_verification_endpoint: string;
  timestamp: number;
  receipt_id: string;
};

export type VentureProofInput = {
  venture_id: string;
  business_record: Record<string, unknown>;
  execution_proof: Record<string, unknown>;
  revenue_snapshot: Record<string, unknown>;
  mutation_history: Array<Record<string, unknown>>;
  previous_hash?: string;
};

function hash(data: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(data), "utf8").digest("hex");
}

export function createTrustOriginReceipt(input: VentureProofInput): TrustOriginReceipt {
  const payload = {
    venture_id: input.venture_id,
    hashed_business_record: hash(input.business_record || {}),
    timestamped_execution_proof: { ts: Date.now(), hash: hash(input.execution_proof || {}) },
    revenue_proof_snapshot: hash(input.revenue_snapshot || {}),
    mutation_history_hash: hash(input.mutation_history || []),
    previous_hash: String(input.previous_hash || "genesis"),
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

export function trustLoop(ventureReceipt: TrustOriginReceipt) {
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
