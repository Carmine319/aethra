import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function scoutSignal(agent: SwarmAgent, signal: { niche: string; score: number }) {
  logAgentAction({ event: "scout_signal", agent_id: agent.id, signal });
  return { opportunity_score: signal.score * agent.reputation };
}
