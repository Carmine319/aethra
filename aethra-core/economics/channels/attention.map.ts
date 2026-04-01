export function mapAttentionLandscape(channels: Array<{ name: string; cost: number; conversion: number; reach: number }>) {
  return channels.map((channel) => ({
    channel: channel.name,
    cheapAttention: channel.cost <= 0.25,
    saturated: channel.reach >= 0.75 && channel.conversion < 0.08,
    highConversion: channel.conversion >= 0.1,
  }));
}
