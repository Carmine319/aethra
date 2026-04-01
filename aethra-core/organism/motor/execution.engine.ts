export function executeActions(input: { actions: string[]; automationLevel?: number }) {
  const automationLevel = Math.max(0, Math.min(1, Number(input.automationLevel || 0.7)));
  const executed = input.actions.map((action, index) => ({
    action,
    status: "executed",
    latencyMs: Math.max(60, Math.floor(900 - automationLevel * 500 - index * 40)),
  }));
  return {
    executed,
    throughput: executed.length,
    frictionScore: Number((1 - automationLevel).toFixed(4)),
  };
}
