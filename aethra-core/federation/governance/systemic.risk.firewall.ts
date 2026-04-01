import { readFederationPolicy } from "./federation.policy";

export function blockSystemRisk(signal: { correlation: number }) {
  const p = readFederationPolicy();
  const thr = Number(p.correlation_block_threshold ?? 0.8);
  if (Number(signal.correlation ?? 0) > thr) {
    return "blocked";
  }
  return "allowed";
}
