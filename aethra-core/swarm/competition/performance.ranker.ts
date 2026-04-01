import type { SwarmAgent } from "../agents/agent.registry";

export function rankAgents(agents: SwarmAgent[]): SwarmAgent[] {
  return [...(agents || [])].sort(
    (a, b) =>
      Number(b.performance || 0) * Number(b.reputation || 1) - Number(a.performance || 0) * Number(a.reputation || 1)
  );
}
