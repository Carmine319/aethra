export function measureDrift(prevMean: number, currMean: number) {
  const p = Number(prevMean || 0);
  const c = Number(currMean || 0);
  const base = Math.max(1e-9, Math.abs(p));
  return Math.abs(c - p) / base;
}
