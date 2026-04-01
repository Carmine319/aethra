export function maintainIdentity(identity: Record<string, unknown>, signals: Array<Record<string, unknown>>) {
  const pressure = signals.reduce((sum, signal) => sum + Number(signal.pressure || 0.4), 0) / Math.max(1, signals.length);
  return {
    identity,
    stabilityScore: Number((Math.max(0.3, 1 - pressure * 0.35)).toFixed(4)),
    evolutionMode: pressure > 0.7 ? "controlled-adjustment" : "stable-continuity",
  };
}
