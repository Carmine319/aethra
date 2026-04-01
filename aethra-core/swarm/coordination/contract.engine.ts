import { logAgentAction } from "../agents/agent.history.append";

export function signContract(parties: string[], terms: Record<string, unknown>) {
  const id = `contract_${Date.now()}`;
  logAgentAction({ event: "contract_signed", contract_id: id, parties, terms });
  return { contract_id: id, reversible: true, terms };
}
