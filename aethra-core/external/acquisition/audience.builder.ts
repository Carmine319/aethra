import { logExternalEvent } from "../compliance/audit.bridge";

export function defineAudience(profile: { segment: string; constraints: string[]; correlation_id: string }) {
  logExternalEvent({ event: "audience_defined", ...profile });
  return { ...profile, defined_at: Date.now() };
}
