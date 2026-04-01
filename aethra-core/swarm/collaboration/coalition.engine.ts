import { storeAlliance } from "./alliance.memory";
import { logAgentAction } from "../agents/agent.history.append";

export function formCoalition(agentIds: string[], objective: string, expected_yield: number) {
  const coalition = { agentIds, objective, expected_yield };
  storeAlliance({ type: "coalition_formed", ...coalition });
  logAgentAction({ event: "coalition", ...coalition });
  return coalition;
}
