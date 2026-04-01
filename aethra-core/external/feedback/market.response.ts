import { logExternalEvent } from "../compliance/audit.bridge";

export function recordMarketResponse(payload: { correlation_id: string; response: string; impact_score: number }) {
  logExternalEvent({ event: "market_response", ...payload });
  return payload;
}
