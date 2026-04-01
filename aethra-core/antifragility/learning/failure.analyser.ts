export function analyseFailure(context: { subsystem: string; error: string; spread: number }) {
  return {
    intelligence_delta: Math.min(1, Number(context.spread || 0) + 0.05),
    lesson: `Harden ${context.subsystem}: ${context.error}`,
    density_gain: 0.02,
  };
}
