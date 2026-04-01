export function buildRepetitionSchedule(channels: string[], weeklyFrequency: number) {
  const frequency = Math.max(1, weeklyFrequency);
  return channels.map((channel) => ({
    channel,
    weeklyFrequency: frequency,
    objective: "narrative-consistency",
  }));
}
