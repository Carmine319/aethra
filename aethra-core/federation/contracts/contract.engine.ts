import crypto from "crypto";
import { federationLog } from "../memory/partner.registry";
import type { FederationContract } from "./contract.schema";

export function createContract(input: Omit<FederationContract, "terms_hash" | "created_at"> & { terms: string }) {
  const terms_hash = crypto.createHash("sha256").update(String(input.terms), "utf8").digest("hex");
  const c: FederationContract = {
    id: input.id,
    parties: input.parties,
    pricing: Number(input.pricing),
    currency: input.currency || "GBP",
    sla_ms: Number(input.sla_ms),
    terms_hash,
    created_at: Date.now(),
  };
  federationLog({ event: "contract_created", contract_id: c.id, terms_hash });
  return c;
}
