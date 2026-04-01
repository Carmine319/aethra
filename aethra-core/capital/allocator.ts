export function allocateCapital(capital: number) {
  const total = Math.max(0, Number(capital || 0));
  const safe = Number((total * 0.7).toFixed(2));
  const scalable = Number((total * 0.2).toFixed(2));
  const experimental = Number((total * 0.1).toFixed(2));
  return {
    total,
    safe,
    scalable,
    experimental,
    execution: safe,
    testing: scalable,
    reserve: experimental,
  };
}
