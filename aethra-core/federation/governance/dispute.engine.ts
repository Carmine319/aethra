import { federationLog } from "../memory/partner.registry";

export function openDispute(ref: { contract_id: string; claimant: string; summary: string }) {
  federationLog({ event: "dispute_opened", ...ref });
  return { dispute_id: `dsp_${Date.now()}`, status: "open" };
}
