import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function sellerQuote(agent: SwarmAgent, deal: { price: number; probability_close: number }) {
  const ev = Number(deal.price || 0) * Number(deal.probability_close || 0);
  logAgentAction({ event: "seller_quote", agent_id: agent.id, ev });
  return { expected_value: ev };
}
