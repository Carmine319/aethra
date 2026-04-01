import { readFederationPolicy } from "../governance/federation.policy";
import { federationLog } from "../memory/partner.registry";

export function compressIntelligence(data: any[]) {
  const p = readFederationPolicy();
  const n = Math.max(1, Number(p.compression_window ?? 5));
  const compressed = (data || []).slice(-n);
  federationLog({ event: "intelligence_compressed", kept: compressed.length });
  return compressed;
}
