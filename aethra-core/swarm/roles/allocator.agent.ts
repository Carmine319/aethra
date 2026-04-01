import type { SwarmAgent } from "../agents/agent.registry";
import { allocateCapital } from "../../capital/plugin.v7";
import { logAgentAction } from "../agents/agent.history.append";

/** Bridges swarm intent to Ω v7 capital allocation (read-only import). */
export function allocatorDistribute(agent: SwarmAgent) {
  logAgentAction({ event: "allocator_invoked", agent_id: agent.id });
  const out = allocateCapital();
  logAgentAction({ event: "allocator_complete", agent_id: agent.id, reinvest: out.reinvest });
  return out;
}
