import type { FederationContract } from "../contracts/contract.schema";
import { readFederationPolicy } from "../governance/federation.policy";

export function routeCapability(
  task: { type: string },
  systems: Array<{ id: string; capabilities: string[] }>,
  _contract?: FederationContract | null
) {
  const p = readFederationPolicy();
  if (p.require_contract_for_exchange && !_contract) {
    throw new Error("Exchange requires bound contract");
  }
  const hit = (systems || []).find((s) => (s.capabilities || []).includes(task.type));
  return hit || null;
}
