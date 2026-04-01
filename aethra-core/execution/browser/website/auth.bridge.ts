import { audit } from "../telemetry/tracer";

export function verifyUserSession(token: string) {
  if (!token || String(token).trim().length < 8) {
    throw new Error("Invalid auth");
  }
  audit("auth_verified", { token_present: true });
  return true;
}

export function assertAttributableOwner(ownerId: string) {
  const id = String(ownerId || "").trim();
  if (!id) throw new Error("Session owner attribution is required");
  return id;
}
