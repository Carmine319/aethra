export function trackCompetitors(competitors: Array<Record<string, unknown>>) {
  const tracked = competitors.map((item) => ({
    name: String(item.name || "unknown"),
    velocity: Number(item.velocity || 0.3),
    framing: String(item.framing || "feature-led"),
  }));
  return {
    tracked,
    averageVelocity: Number((tracked.reduce((acc, c) => acc + c.velocity, 0) / Math.max(1, tracked.length)).toFixed(4)),
  };
}
