export function runPosting(channels: string[]) {
  return channels.map((channel) => ({ channel, posted: true, reach: 100 + channel.length * 20 }));
}
