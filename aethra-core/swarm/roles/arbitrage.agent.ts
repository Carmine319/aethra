import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

/** Identifies spread / inefficiency; execution still governed downstream (Ω v4–v5). */
export function arbitrageOpportunity(agent: SwarmAgent, spread: number) {
  const edge = Math.max(0, Number(spread || 0));
  logAgentAction({ event: "arbitrage_edge", agent_id: agent.id, spread: edge });
  return { expected_capture: edge * agent.capital * 0.01 };
}
