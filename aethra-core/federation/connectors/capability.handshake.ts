import { negotiateProtocol } from "./protocol.negotiator";
import { federationLog } from "../memory/partner.registry";

export function handshake(localCaps: string[], remoteCaps: string[], partnerId: string) {
  const neg = negotiateProtocol(localCaps, remoteCaps);
  federationLog({ event: "handshake", partner_id: partnerId, ...neg });
  return neg;
}
