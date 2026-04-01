export function recoverSystem(error: { fixPriority: string; rootCause: string }, fallback: { switchedChannels: boolean; exposureReduced: boolean; campaignPaused: boolean }) {
  return {
    restartedModule: true,
    rerunExecution: error.fixPriority !== "high",
    fallbackActivated: fallback.switchedChannels || fallback.exposureReduced || fallback.campaignPaused,
    recoveryStatus: "applied",
  };
}
