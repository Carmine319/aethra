/**
 * Continuous calibration: shrink confidence toward empirical hit-rate prior.
 */
export function calibrateConfidence(rawConfidence: number, empiricalHitRate: number) {
  const c = Math.max(0.01, Math.min(0.99, Number(rawConfidence)));
  const h = Math.max(0.01, Math.min(0.99, Number(empiricalHitRate)));
  const blended = c * 0.6 + h * 0.4;
  return Math.round(blended * 1000) / 1000;
}
