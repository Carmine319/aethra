export function optimiseCycles(iterationsPerWeek: number, learningLatencyHours: number) {
  const improvedIterations = Math.max(1, iterationsPerWeek + Math.max(1, Math.floor((24 - learningLatencyHours) / 6)));
  return {
    before: iterationsPerWeek,
    after: improvedIterations,
    optimisationLift: Number((improvedIterations / Math.max(1, iterationsPerWeek)).toFixed(4)),
  };
}
