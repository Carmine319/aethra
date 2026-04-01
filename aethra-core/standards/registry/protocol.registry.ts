/**
 * Ω v15 — In-memory protocol registry (observable registrations).
 */

const store = new Map<string, { fingerprint: string; registeredAt: number }>();

export function registerProtocol(name: string, fingerprint: string) {
  store.set(name, { fingerprint, registeredAt: Date.now() });
  return { name, ok: true };
}

export function getProtocol(name: string) {
  return store.get(name) ?? null;
}

export function listProtocols() {
  return [...store.keys()];
}
