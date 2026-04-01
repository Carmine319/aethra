export function optimisePrice(base: number, demand: number) {
  const b = Number(base) || 0;
  const d = Math.max(0, Number(demand) || 0);
  return Math.round((b + d * 0.1) * 100) / 100;
}
