export function updateStrategy(adjustment: { nextConfidenceTarget: number; calibrationShift: number }) {
  return {
    strategyMode: adjustment.calibrationShift < 0 ? "defensive-exploration" : "scaled-exploitation",
    confidenceTarget: adjustment.nextConfidenceTarget,
  };
}
