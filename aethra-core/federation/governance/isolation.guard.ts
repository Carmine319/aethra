import { readFederationPolicy } from "./federation.policy";

/** No single network may dominate the dependency graph. */
export function assertPartnerShare(usageByPartner: Record<string, number>, totalUsage: number) {
  const p = readFederationPolicy();
  const maxShare = Number(p.max_partner_dependency_share ?? 0.35);
  const t = Math.max(1e-9, Number(totalUsage || 0));
  for (const [partner, u] of Object.entries(usageByPartner || {})) {
    if (Number(u) / t > maxShare) {
      throw new Error(`Partner dominance blocked: ${partner} exceeds ${maxShare}`);
    }
  }
  return { ok: true };
}
