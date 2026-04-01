import { readForesightPolicy } from "../governance/policy.gate";

export function mapCapital(decision: any, capital: number) {
  const pol = readForesightPolicy();
  const cap = Math.max(0, Number(capital || 0));
  const conf = Math.max(
    Number(pol.min_confidence_for_capital_map ?? 0.05),
    Math.min(0.99, Number(decision.confidence ?? 0))
  );
  const maxFrac = Number(pol.max_capital_fraction_per_decision ?? 0.35);
  const raw = cap * conf;
  const allocation = Math.min(raw, cap * maxFrac);
  return {
    ...decision,
    allocation: Math.round(allocation * 100) / 100,
    capital_base: cap,
    confidence_used: conf,
  };
}
