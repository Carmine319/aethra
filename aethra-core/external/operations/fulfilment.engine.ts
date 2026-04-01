import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "../connectors/identity.connector";

export function markFulfilled(order_id: string, correlation_id: string) {
  logExternalEvent({ event: "fulfilment", order_id, correlation_id });
  return bindToEntity({ type: "fulfilment", order_id, correlation_id, venture_id: correlation_id });
}
