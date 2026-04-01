export function compactEfficiency(input: { manualSteps: number; toolCount: number }) {
  return {
    reducedManualSteps: Math.max(0, input.manualSteps - 2),
    reducedTools: Math.max(1, input.toolCount - 1),
    compactionScore: Number((1 - Math.max(0.1, input.manualSteps * 0.08 + input.toolCount * 0.05)).toFixed(4)),
  };
}
