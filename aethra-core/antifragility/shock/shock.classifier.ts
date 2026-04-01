export type ShockClass = "supply" | "demand" | "liquidity" | "operational" | "unknown";

export function classifyShock(profile: { intensity: number; channels?: string[] }): ShockClass {
  const ch = profile.channels || [];
  if (ch.includes("liquidity")) return "liquidity";
  if (ch.includes("supply")) return "supply";
  if (ch.includes("demand")) return "demand";
  if (ch.includes("operational")) return "operational";
  if (Number(profile.intensity || 0) > 100) return "liquidity";
  return "unknown";
}
