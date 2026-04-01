import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "./identity.connector";

export function syncCrmRecord(payload: { deal_id: string; stage: string; correlation_id: string }) {
  const bound = bindToEntity({
    type: "crm_sync",
    ...payload,
    venture_id: payload.correlation_id,
  });
  logExternalEvent({ event: "crm_sync", deal_id: payload.deal_id });
  return bound;
}
