/**
 * Ω v15 — Hard gate: protocols without schema cannot enter the compliant registry path.
 */

export function enforceInvariance(protocol: any) {
  if (!protocol.schema) {
    throw new Error("Protocol invariance violation");
  }
}
