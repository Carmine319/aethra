import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function negotiate(agent: SwarmAgent, task: { id: string; reserve_price?: number }) {
  const offer = Math.min(agent.capital * 0.1, Number(task.reserve_price || Infinity));
  const confidence = agent.reputation;
  logAgentAction({ event: "negotiation", agent_id: agent.id, task_id: task.id, offer, confidence });
  return { offer, confidence, task_id: task.id };
}
