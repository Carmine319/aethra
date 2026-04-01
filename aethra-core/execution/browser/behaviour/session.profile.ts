export function buildSessionProfile(sessionId: string) {
  return {
    sessionId,
    maxActionsPerHour: 20,
    avgDelayMultiplier: 1.0,
    allowedPlatforms: ["x", "linkedin", "youtube"],
  };
}

export function assertPlatformAllowed(profile: ReturnType<typeof buildSessionProfile>, platform: string) {
  const p = String(platform || "").toLowerCase();
  if (!profile.allowedPlatforms.includes(p)) {
    throw new Error(`Platform not allowed for this session: ${platform}`);
  }
}
