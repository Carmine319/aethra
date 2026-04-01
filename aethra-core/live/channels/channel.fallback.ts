export function switchChannel(dead: string[], available: string[]) {
  const alternatives = available.filter((channel) => !dead.includes(channel));
  return {
    switched: dead.length > 0,
    nextChannels: alternatives.slice(0, 2),
  };
}
