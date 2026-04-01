export function filterNoise(signals: Array<{ value: number; provenance: unknown }>, threshold = 0.01) {
  return (signals || []).filter((s) => Math.abs(Number(s.value || 0)) >= threshold);
}
