export function detectSignalAnomalies(signals: Array<{ value: number }>) {
  const vals = (signals || []).map((s) => Number(s.value || 0));
  const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
  const variance =
    vals.reduce((s, v) => s + (v - mean) * (v - mean), 0) / Math.max(1, vals.length);
  const stdev = Math.sqrt(variance);
  return (signals || []).map((s, i) => ({
    ...s,
    z_score: stdev > 0 ? (Number(s.value) - mean) / stdev : 0,
    index: i,
  }));
}
