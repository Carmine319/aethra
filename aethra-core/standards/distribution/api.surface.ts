/**
 * Ω v15 — Declarative HTTP-ish route map for integration visibility.
 */

export function declareApiSurface(protocolName: string, operations: string[]) {
  return operations.map((op) => ({
    path: `/aethra/protocol/${encodeURIComponent(protocolName)}/${op}`,
    method: "POST",
  }));
}
