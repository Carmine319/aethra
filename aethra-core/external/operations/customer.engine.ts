import { bindToEntity } from "../connectors/identity.connector";
import { logExternalEvent } from "../compliance/audit.bridge";

export function upsertCustomer(record: { customer_id: string; correlation_id: string; tags?: string[] }) {
  logExternalEvent({ event: "customer_upsert", customer_id: record.customer_id });
  return bindToEntity({ type: "customer", ...record, venture_id: record.correlation_id });
}
