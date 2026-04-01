export function executeChannels(channels: string[]) {
  return channels.map((channel) => ({ channel, executed: true }));
}
