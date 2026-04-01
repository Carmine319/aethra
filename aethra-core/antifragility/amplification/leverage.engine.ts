import { readAntifragilityPolicy } from "../governance/stress.policy";

export function boundedLeverage(conviction: number) {
  const p = readAntifragilityPolicy();
  const cap = Number(p.max_leverage_cap ?? 1.5);
  const c = Math.max(0, Math.min(1, Number(conviction || 0)));
  return Math.min(cap, 1 + c * (cap - 1));
}
