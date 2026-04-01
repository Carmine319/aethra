/**
 * Ω v15 — Role tags for layered coordination (issuer, verifier, executor, observer).
 */

export type SpecialisedRole = "issuer" | "verifier" | "executor" | "observer";

export function assignRoles(entityId: string, roles: SpecialisedRole[]) {
  return { entityId, roles: [...new Set(roles)] };
}
