import { federationLog } from "../memory/partner.registry";
import type { FederationContract } from "../contracts/contract.schema";

export function exchangeModelRef(contract: FederationContract, model_uri: string) {
  federationLog({ event: "model_exchange", contract_id: contract.id, model_uri });
  return { model_uri, contract_bound: true };
}
