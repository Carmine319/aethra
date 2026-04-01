import { createTrustOriginReceipt } from "../../trustorigin/integration";

export function anchorTrustBundle(payload: {
  venture_id: string;
  contract_id: string;
  execution_proof: Record<string, unknown>;
}) {
  return createTrustOriginReceipt({
    venture_id: payload.venture_id,
    business_record: { contract_id: payload.contract_id },
    execution_proof: payload.execution_proof,
    revenue_snapshot: {},
    mutation_history: [{ action: "federation_trust_anchor", ts: Date.now() }],
    previous_hash: "genesis",
  });
}
