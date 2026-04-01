/**
 * Produces a bounded variant for experiments (reversible: caller stores original + variant id).
 */
export function mutate(input: string, variantId = "v1"): string {
  const base = String(input || "").trim();
  if (!base) return base;
  const suffix =
    variantId === "v1" ? " — validated offer" : variantId === "v2" ? " — limited availability" : " — structured CTA";
  return base.length > 200 ? base.slice(0, 197) + "…" + suffix : base + suffix;
}
