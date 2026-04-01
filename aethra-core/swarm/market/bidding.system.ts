import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function submitBid(agent: SwarmAgent, taskId: string, bidAmount: number) {
  const bid = Math.min(Number(bidAmount || 0), Number(agent.capital || 0));
  logAgentAction({ event: "bid", agent_id: agent.id, task_id: taskId, bid });
  return { task_id: taskId, bid, agent_id: agent.id };
}
