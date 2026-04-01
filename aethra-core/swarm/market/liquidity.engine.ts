function liquidityFraction(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function injectLiquidity(market: any[], capital: number) {
  const base = Math.max(0, Number(capital || 0));
  return (market || []).map((task, i) => ({
    ...task,
    liquidity: Math.round(base * liquidityFraction(String(task?.id ?? i)) * 100) / 100,
  }));
}
