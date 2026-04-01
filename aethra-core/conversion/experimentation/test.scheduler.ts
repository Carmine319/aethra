export function scheduleTests() {
  return {
    continuous: true,
    cadenceMs: 15 * 60 * 1000,
    nextRunAt: Date.now() + 15 * 60 * 1000,
  };
}
