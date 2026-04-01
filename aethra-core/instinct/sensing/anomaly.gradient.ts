export function detectGradients(signals: Array<{ id: string; strength: number; direction: number }>) {
  const gradients = signals.map((signal) => ({
    id: signal.id,
    gradient: Number((signal.direction - signal.strength * 0.2).toFixed(4)),
    accelerating: Math.abs(signal.direction) > 0.35,
  }));
  return {
    gradients,
    preTrendShifts: gradients.filter((item) => item.accelerating).map((item) => item.id),
  };
}
