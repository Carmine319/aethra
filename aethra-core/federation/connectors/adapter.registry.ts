import { federationLog } from "../memory/partner.registry";

const adapters = new Map<string, { protocol: string; version: string }>();

export function registerAdapter(id: string, meta: { protocol: string; version: string }) {
  adapters.set(id, meta);
  federationLog({ event: "adapter_registered", adapter_id: id, ...meta });
  return adapters.get(id);
}

export function listAdapters() {
  return [...adapters.entries()].map(([id, m]) => ({ id, ...m }));
}
