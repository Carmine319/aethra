import { readFederationPolicy } from "../governance/federation.policy";
import type { FederationContract } from "./contract.schema";
import { federationLog } from "../memory/partner.registry";

export function adjustContract(contract: FederationContract, performance: { success: boolean }) {
  const p = readFederationPolicy();
  const b = p.contract_price_adjustment_bounds || { up: 1.1, down: 0.9 };
  const up = Number(b.up ?? 1.1);
  const down = Number(b.down ?? 0.9);
  const mult = performance.success ? Math.min(up, 1.15) : Math.max(down, 0.85);
  const next = {
    ...contract,
    pricing: Math.round(Number(contract.pricing) * mult * 100) / 100,
  };
  federationLog({
    event: "contract_adjusted",
    contract_id: contract.id,
    mult,
    pricing: next.pricing,
  });
  return next;
}
