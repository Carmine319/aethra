export function reduceLatency(currentLatencyMs: number) {
  const reducedLatencyMs = Math.max(50, Math.floor(currentLatencyMs * 0.75));
  return {
    currentLatencyMs,
    reducedLatencyMs,
    gain: Number(((currentLatencyMs - reducedLatencyMs) / Math.max(1, currentLatencyMs)).toFixed(4)),
  };
}
