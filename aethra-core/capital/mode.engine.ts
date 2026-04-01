export type SovereignMode = "capital_preservation" | "adaptive" | "aggressive";

export function selectMode(context: any): SovereignMode {
  const { capital, confidence, signalStrength } = context || {};
  if (Number(capital || 0) < 200) return "capital_preservation";
  if (Number(confidence || 0) > 0.7 && Number(signalStrength || 0) > 0.7) return "aggressive";
  return "adaptive";
}

export function applyUserMode(systemMode: SovereignMode, userPreference?: string): SovereignMode {
  if (!userPreference || userPreference === "auto") return systemMode;
  if (userPreference === "safe") return "capital_preservation";
  if (userPreference === "aggressive" && systemMode !== "capital_preservation") return "aggressive";
  return systemMode;
}
