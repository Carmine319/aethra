import { logExternalEvent } from "../compliance/audit.bridge";

export function ingestMarketSignal(signal: { channel: string; metric: string; value: number; correlation_id: string }) {
  logExternalEvent({ event: "signal_ingest", ...signal });
  return { ...signal, ingested_at: Date.now() };
}
