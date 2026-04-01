/**
 * Ω v15 — Partner capability bundle for ecosystem onboarding.
 */

export function enablePartner(partnerId: string, roles: string[]) {
  return {
    partnerId,
    roles,
    enabledAt: Date.now(),
    standardsLayer: "core.v15",
  };
}
