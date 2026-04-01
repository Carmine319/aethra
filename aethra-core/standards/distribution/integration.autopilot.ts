import { loadProtocol } from "./zero.friction.loader";
import { generateSdkStub } from "./sdk.generator";

/**
 * Ω v15 — Single-call integration helper (minimal decision overhead).
 */

export function autopilotIntegrate(protocol: { name: string; fields: Record<string, string> }) {
  const loaded = loadProtocol(protocol);
  const sdk = generateSdkStub(protocol);
  return { loaded, sdk, next: "wire_transport" as const };
}
