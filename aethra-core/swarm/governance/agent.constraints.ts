import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function assertAgentEconomicallyJustified(agent: SwarmAgent, minUtility = 0) {
  const u = Number(agent.expectedUtility ?? 0);
  if (!Number.isFinite(u) || u < minUtility) {
    throw new Error("No action without economic justification");
  }
}

export function assertMeasurableUtility(agent: SwarmAgent) {
  if (agent.expectedUtility == null || !Number.isFinite(Number(agent.expectedUtility))) {
    throw new Error("Agent must declare measurable utility");
  }
  logAgentAction({ event: "utility_assertion", agent_id: agent.id, expected_utility: agent.expectedUtility });
}
