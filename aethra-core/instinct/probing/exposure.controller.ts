export function controlExposure(capital: number, uncertainty: number) {
  const uncertaintyClamped = Math.max(0, Math.min(1, uncertainty));
  const maxProbeSpend = Number((capital * (0.04 + (1 - uncertaintyClamped) * 0.08)).toFixed(2));
  return {
    maxProbeSpend,
    reversible: true,
    staged: true,
  };
}
