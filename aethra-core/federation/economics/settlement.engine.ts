import { federationLog } from "../memory/partner.registry";

export function settle(partnerId: string, amount_gbp: number, ref: string) {
  federationLog({ event: "settlement", partner_id: partnerId, amount_gbp, ref });
  return { settled: true, amount_gbp };
}
