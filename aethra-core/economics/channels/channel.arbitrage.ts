export function findChannelArbitrage(channels: Array<{ name: string; conversion: number; cost: number }>) {
  const opportunities = channels
    .filter((channel) => channel.conversion > channel.cost * 0.2)
    .map((channel) => ({
      name: channel.name,
      arbitrageScore: Number((channel.conversion / Math.max(0.01, channel.cost)).toFixed(4)),
    }));
  return opportunities.sort((a, b) => b.arbitrageScore - a.arbitrageScore);
}
