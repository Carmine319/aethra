import { audit, trace } from "../telemetry/tracer";

export async function handleWebhook(event: any) {
  const type = String(event && event.type ? event.type : "unknown");
  trace("webhook_incoming", { type });
  audit("webhook_incoming", {
    type,
    ts: Date.now(),
    source: String((event && event.source) || "unknown"),
  });
  return { ok: true, received: true, type };
}
