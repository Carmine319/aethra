export function scheduleOptimisationLoop() {
  return {
    alwaysOn: true,
    intervalMs: 10 * 60 * 1000,
    reason: "continuous conversion optimisation",
  };
}
