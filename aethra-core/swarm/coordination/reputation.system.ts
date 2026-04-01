import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function adjustReputation(agent: SwarmAgent, delta: number) {
  agent.reputation = Math.max(0.1, Math.min(10, Number(agent.reputation || 1) + Number(delta || 0)));
  logAgentAction({ event: "reputation_adjust", agent_id: agent.id, reputation: agent.reputation });
  return agent.reputation;
}
