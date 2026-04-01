export function detectBottlenecks(input: { frictionScore: number; conversionRate: number; delayHours: number }) {
  const bottlenecks: string[] = [];
  if (input.frictionScore > 1) bottlenecks.push("funnel-friction");
  if (input.conversionRate < 0.08) bottlenecks.push("conversion-weakness");
  if (input.delayHours > 8) bottlenecks.push("speed-lag");
  return bottlenecks;
}
