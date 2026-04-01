export function buildFeatures(aggregatedSignals: Array<{ value: number; weight?: number; z_score?: number }>) {
  const momentum = (aggregatedSignals || []).reduce((s, x) => s + Number(x.value || 0) * Number(x.weight || 1), 0);
  const stress = (aggregatedSignals || []).reduce((s, x) => s + Math.abs(Number(x.z_score || 0)), 0);
  return [
    { name: "momentum", momentum: momentum / Math.max(1, aggregatedSignals.length || 1) },
    { name: "stress", momentum: -stress / Math.max(1, aggregatedSignals.length || 1) },
  ];
}
