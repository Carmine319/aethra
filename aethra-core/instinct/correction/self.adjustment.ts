export function selfAdjust(confidence: number, errorRate: number) {
  return {
    calibrationShift: Number((errorRate > 0.5 ? -0.08 : 0.03).toFixed(4)),
    nextConfidenceTarget: Number(Math.max(0.1, Math.min(0.95, confidence + (errorRate > 0.5 ? -0.08 : 0.03))).toFixed(4)),
  };
}
