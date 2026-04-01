import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function creatorIntent(agent: SwarmAgent, payload: { offer_headline: string; expected_margin: number }) {
  logAgentAction({ event: "creator_intent", agent_id: agent.id, payload });
  return { ok: true, economic_justification: payload.expected_margin * agent.reputation };
}
