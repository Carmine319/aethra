export function distillSignals(signals: Array<{ weight?: number; value: number }>) {
  const s = signals || [];
  const top = [...s].sort((a, b) => Math.abs(Number(b.value)) - Math.abs(Number(a.value))).slice(0, 5);
  return top.map((x) => ({ v: Number(x.value), w: Number(x.weight || 1) }));
}
