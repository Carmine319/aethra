export function activateFallback(system: { deadChannels: string[]; riskMode: string }) {
  return {
    switchedChannels: system.deadChannels.length > 0,
    exposureReduced: system.riskMode !== "normal",
    campaignPaused: system.deadChannels.length > 1,
  };
}
