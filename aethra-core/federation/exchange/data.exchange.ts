import { federationLog } from "../memory/partner.registry";
import type { FederationContract } from "../contracts/contract.schema";
import { readFederationPolicy } from "../governance/federation.policy";

export function exchangeDataPayload(contract: FederationContract, partnerId: string, payload_hash: string) {
  const p = readFederationPolicy();
  if (p.require_contract_for_exchange && (!contract || !contract.id)) {
    throw new Error("Data exchange requires contract");
  }
  federationLog({ event: "data_exchange", partner_id: partnerId, payload_hash, contract_id: contract.id });
  return { ok: true, verifiable: true };
}
