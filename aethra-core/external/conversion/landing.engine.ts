import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "../connectors/identity.connector";

export function publishLandingVariant(payload: {
  url: string;
  variant_id: string;
  correlation_id: string;
}) {
  if (!String(payload.url || "").startsWith("https://")) {
    throw new Error("Landing URL must use HTTPS");
  }
  logExternalEvent({ event: "landing_publish", variant_id: payload.variant_id, correlation_id: payload.correlation_id });
  return bindToEntity({
    type: "landing_variant",
    ...payload,
    venture_id: payload.correlation_id,
  });
}
