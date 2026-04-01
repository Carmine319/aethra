export function enforceExposureLimit(allocation: number, total: number, capRatio = 0.4) {
  const max = Number(total || 0) * Math.max(0, Math.min(1, Number(capRatio || 0.4)));
  const value = Number(allocation || 0);
  if (value > max) return max;
  if (value < 0) return 0;
  return value;
}
