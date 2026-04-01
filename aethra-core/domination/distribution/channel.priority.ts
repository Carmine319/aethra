export function prioritiseChannels(channels: Array<{ name: string; roi?: number; reach?: number }>) {
  return [...channels]
    .sort((a, b) => (Number(b.roi || 0) * 0.7 + Number(b.reach || 0) * 0.3) - (Number(a.roi || 0) * 0.7 + Number(a.reach || 0) * 0.3))
    .slice(0, 5);
}
