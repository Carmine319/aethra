export function mapDecisionToActions(decision: { id: string; expectedValue: number }) {
  return [
    { type: "observe", ref: decision.id },
    { type: "position_capital", ref: decision.id, scale: Math.max(0, Math.min(1, Number(decision.expectedValue) / 100)) },
  ];
}
