import { logExternalEvent } from "../compliance/audit.bridge";

export function logTicket(ticket: { id: string; correlation_id: string; severity: string }) {
  logExternalEvent({ event: "support_ticket", ...ticket });
  return ticket;
}
