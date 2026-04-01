export function calculateSaturation(exposures: number, targetReach: number) {
  const saturation = Number((Math.max(0, exposures) / Math.max(1, targetReach)).toFixed(4));
  return {
    saturation: Math.min(1, saturation),
    underDistributed: saturation < 0.6,
  };
}
