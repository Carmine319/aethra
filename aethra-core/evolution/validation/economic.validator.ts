import type { EvolutionProposal } from "../proposals/proposal.schema";
import { readEvolutionPolicy } from "../governance/evolution.policy";

export function validateEconomics(proposal: EvolutionProposal) {
  const p = readEvolutionPolicy();
  if (!p.require_economic_validation) return true;
  const gain = Number(proposal.expectedImpact?.revenue || 0);
  const risk = Number(proposal.expectedImpact?.risk || 0);
  return gain > risk;
}
