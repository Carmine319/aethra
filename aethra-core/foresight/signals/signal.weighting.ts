export function weightSignals(signals: any[]) {
  return (signals || []).map((s) => ({
    ...s,
    weight: Math.abs(Number(s.value ?? 0)) * 0.5 + 1,
  }));
}
