import { storePattern } from "./pattern.memory";

export function adaptFromFailure(analysis: { lesson: string; subsystem?: string; intelligence_delta?: number }) {
  storePattern({
    type: "adaptation",
    lesson: analysis.lesson,
    subsystem: analysis.subsystem || "unknown",
    intelligence_delta: analysis.intelligence_delta ?? 0,
  });
  return { applied: true, strategy_delta: analysis.intelligence_delta ?? 0 };
}
