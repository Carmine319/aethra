import { SovereignMode } from "./mode.engine";

export function allocateByMode(mode: SovereignMode, capital: number) {
  const c = Math.max(0, Number(capital || 0));
  if (mode === "capital_preservation") {
    return { safe: c * 0.9, scalable: c * 0.1, experimental: 0 };
  }
  if (mode === "adaptive") {
    return { safe: c * 0.7, scalable: c * 0.2, experimental: c * 0.1 };
  }
  return { safe: c * 0.4, scalable: c * 0.3, experimental: c * 0.3 };
}
