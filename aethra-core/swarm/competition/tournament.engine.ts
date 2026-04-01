import type { SwarmAgent } from "../agents/agent.registry";
import { rankAgents } from "./performance.ranker";
import { logAgentAction } from "../agents/agent.history.append";

export function runTournament(agents: SwarmAgent[]) {
  const ranked = rankAgents(agents);
  logAgentAction({ event: "tournament_complete", top: ranked[0]?.id ?? null });
  return ranked;
}
