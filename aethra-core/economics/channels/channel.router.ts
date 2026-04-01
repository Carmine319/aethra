export function routeChannels(channels: Array<{ name: string; conversion: number; cost: number }>) {
  return [...channels]
    .sort((a, b) => (b.conversion - b.cost * 0.4) - (a.conversion - a.cost * 0.4))
    .slice(0, 2);
}
