export function attributePerformance(decisions: any[]) {
  return (decisions || []).map((d) => ({
    decision: d,
    impact: Number(d.expectedValue ?? 0) - Number(d.actual ?? 0),
  }));
}
