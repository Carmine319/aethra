export function mutateStrategy(strategy: Record<string, unknown>) {
  return {
    ...strategy,
    mutationId: `mut_${Date.now()}`,
    changes: ["message-variant", "offer-stack-adjustment", "channel-shift"],
  };
}
