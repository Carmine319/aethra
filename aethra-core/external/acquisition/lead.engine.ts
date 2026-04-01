import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "../connectors/identity.connector";

export function ingestLead(lead: { id: string; source: string; score?: number; correlation_id: string }) {
  const b = bindToEntity({ type: "lead", ...lead, venture_id: lead.correlation_id });
  logExternalEvent({ event: "lead_ingested", lead_id: lead.id });
  return b;
}
