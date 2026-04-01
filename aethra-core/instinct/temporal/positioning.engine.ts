export function determineTemporalPositioning(confidence: number, uncertainty: number) {
  const entry = confidence > 0.62 ? "early-entry" : "observe-and-probe";
  const scale = confidence > 0.72 && uncertainty < 0.35 ? "scale-now" : "scale-after-validation";
  const exit = uncertainty > 0.65 ? "fast-exit" : "hold-and-monitor";
  return { entry, scale, exit };
}
