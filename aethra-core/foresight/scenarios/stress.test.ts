export function stressTest(point: number, shock: number) {
  return Math.round(Number(point || 0) * (1 - Math.abs(Number(shock || 0))) * 1000) / 1000;
}
