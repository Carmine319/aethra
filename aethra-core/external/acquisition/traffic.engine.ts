import { logExternalEvent } from "../compliance/audit.bridge";

export function recordTraffic(channel: string, visits: number, correlation_id: string) {
  const row = { channel, visits: Number(visits || 0), correlation_id };
  logExternalEvent({ event: "traffic", ...row });
  return row;
}
