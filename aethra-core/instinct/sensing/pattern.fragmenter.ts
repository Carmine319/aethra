export function fragmentPatterns(signals: Array<{ id: string; strength: number; direction: number }>) {
  return signals.map((signal) => ({
    fragmentId: `${signal.id}_frag`,
    fragmentStrength: Number((signal.strength * 0.8).toFixed(4)),
    gradientHint: Number((signal.direction * 0.6).toFixed(4)),
  }));
}
