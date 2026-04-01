import { federationLog } from "../memory/partner.registry";

export function assertAccess(token: string, partnerId: string) {
  if (!token || String(token).length < 8) {
    throw new Error("Contract-bound access: invalid token");
  }
  federationLog({ event: "access_granted", partner_id: partnerId });
  return true;
}
