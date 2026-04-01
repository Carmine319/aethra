export function computeROI(revenue: number, capitalAllocated: number) {
  const rev = Number(revenue || 0);
  const cap = Math.max(1, Number(capitalAllocated || 0));
  return Number((rev / cap).toFixed(4));
}
