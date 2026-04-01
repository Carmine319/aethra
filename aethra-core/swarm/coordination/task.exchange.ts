import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function publishTask(task: { id: string; reward: number; risk_cap: number }) {
  logAgentAction({ event: "task_published", task });
  return { ok: true, task_id: task.id };
}

export function claimTask(agent: SwarmAgent, taskId: string) {
  logAgentAction({ event: "task_claim", agent_id: agent.id, task_id: taskId });
  return { agent_id: agent.id, task_id: taskId };
}
