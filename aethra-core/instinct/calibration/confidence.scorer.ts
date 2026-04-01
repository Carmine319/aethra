export function scoreConfidence(results: { averageLift: number; passedCount: number; failureCount: number }) {
  const total = Math.max(1, results.passedCount + results.failureCount);
  const confidence = Math.max(0.05, Math.min(0.95, (results.passedCount / total) * 0.7 + results.averageLift * 0.3));
  return Number(confidence.toFixed(4));
}
