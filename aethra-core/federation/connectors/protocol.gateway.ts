import { assertFederationOperational } from "../governance/federation.policy";
import { handshake } from "./capability.handshake";
import { blockSystemRisk } from "../governance/systemic.risk.firewall";

export function gatewayIngress(payload: {
  partner_id: string;
  local_caps: string[];
  remote_caps: string[];
  correlation_hint: number;
}) {
  assertFederationOperational();
  if (blockSystemRisk({ correlation: payload.correlation_hint }) === "blocked") {
    throw new Error("Systemic risk firewall blocked ingress");
  }
  return handshake(payload.local_caps, payload.remote_caps, payload.partner_id);
}
