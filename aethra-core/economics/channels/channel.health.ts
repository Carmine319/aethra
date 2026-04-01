export function assessChannelHealth(channels: Array<{ name: string; conversion: number; cost: number }>) {
  return channels.map((channel) => ({
    name: channel.name,
    health: Number((channel.conversion - channel.cost * 0.2 + 0.5).toFixed(4)),
  }));
}
