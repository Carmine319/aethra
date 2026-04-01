export function ensureUbiquity(channels: string[], activePlacements: number) {
  const keyChannels = Math.max(1, channels.length);
  const ubiquityScore = Number((Math.max(0, activePlacements) / keyChannels).toFixed(4));
  return {
    ubiquityScore,
    consistentPresence: ubiquityScore >= 1,
    conversionPath: "familiarity->trust->conversion",
  };
}
