export function scaleShockIntensity(data: { variance: number; velocity: number; duration?: number }) {
  const variance = Math.max(0, Number(data.variance ?? 0));
  const velocity = Math.max(0, Number(data.velocity ?? 0));
  return {
    intensity: variance * velocity,
    persistence: Math.max(1, Number(data.duration ?? 1)),
  };
}
