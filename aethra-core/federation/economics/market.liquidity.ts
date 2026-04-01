export function computeLiquidity(flows: Array<{ value: number }>) {
  return (flows || []).reduce((sum, f) => sum + Math.max(0, Number(f.value || 0)), 0);
}
