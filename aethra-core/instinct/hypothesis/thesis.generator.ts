export function generateTheses(hypotheses: Array<{ id: string; thesis: string; confidence: number }>) {
  return hypotheses.map((hypothesis) => ({
    hypothesisId: hypothesis.id,
    thesis: hypothesis.thesis,
    narrativeProbe: hypothesis.confidence > 0.6 ? "exploit signal immediately" : "validate niche demand first",
  }));
}
