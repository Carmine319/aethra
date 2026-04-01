import { readAntifragilityPolicy } from "../governance/stress.policy";

/** NO full capital exposure: protected core + capped optional convex sleeve. */
export function applyConvexity(capital: number, signal: { multiplier: number }) {
  const p = readAntifragilityPolicy();
  const base = Math.max(0, Number(capital || 0));
  const protFrac = Number(p.protected_capital_fraction ?? 0.6);
  const optFrac = Number(p.optional_capital_fraction ?? 0.4);
  if (protFrac + optFrac > 1.0001) {
    throw new Error("Convexity policy: protected + optional fractions must not exceed 100%");
  }
  const mult = Math.min(
    Number(p.max_optional_multiplier ?? 2.5),
    Math.max(0, Number(signal.multiplier || 0))
  );
  return {
    protected: Math.round(base * protFrac * 100) / 100,
    optional: Math.round(base * optFrac * mult * 100) / 100,
    multiplier_used: mult,
  };
}
