export function testChannels(channels: Array<{ name: string; postingOk: boolean; deliveryOk: boolean; engagement: number }>) {
  const results = channels.map((channel) => ({
    name: channel.name,
    healthy: channel.postingOk && channel.deliveryOk && channel.engagement >= 0.01,
  }));
  return {
    results,
    deadChannels: results.filter((row) => !row.healthy).map((row) => row.name),
  };
}
