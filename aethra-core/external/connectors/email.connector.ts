import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "./identity.connector";

export function queueOutboundEmail(payload: {
  to: string;
  template_id: string;
  correlation_id: string;
  body_hash?: string;
}) {
  const bound = bindToEntity({
    type: "email_outbound",
    ...payload,
    venture_id: payload.correlation_id,
  });
  logExternalEvent({ event: "email_queued", correlation_id: payload.correlation_id });
  return bound;
}
