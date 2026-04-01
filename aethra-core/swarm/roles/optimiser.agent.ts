import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function optimiserProposal(agent: SwarmAgent, lift: number) {
  logAgentAction({ event: "optimiser_proposal", agent_id: agent.id, lift });
  return { expected_conversion_lift: Math.max(0, lift) };
}
