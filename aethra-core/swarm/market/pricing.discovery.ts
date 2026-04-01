export function discoverClearingPrice(bids: number[]): number {
  const sorted = [...(bids || [])].filter((b) => Number.isFinite(b) && b >= 0).sort((a, b) => b - a);
  if (!sorted.length) return 0;
  return sorted[Math.min(1, sorted.length - 1)];
}
