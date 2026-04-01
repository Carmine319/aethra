import { compressIntelligence } from "./intelligence.compression";
import { distillSignals } from "./knowledge.distillation";
import { federationLog } from "../memory/partner.registry";

export function integrateExternalObservations(observations: any[]) {
  const compressed = compressIntelligence(observations);
  const distilled = distillSignals(
    compressed.map((o) => ({
      value: typeof o === "number" ? o : Number((o as any)?.signal ?? (o as any)?.value ?? 0),
      weight: o && typeof o === "object" ? Number((o as any).weight ?? 1) : 1,
    }))
  );
  federationLog({ event: "cross_system_learning", distilled_count: distilled.length });
  return { distilled, internal_advantage_vector: distilled };
}
