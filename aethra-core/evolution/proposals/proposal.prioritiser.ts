import type { EvolutionProposal } from "./proposal.schema";

export function prioritiseProposals(proposals: EvolutionProposal[]) {
  return [...(proposals || [])].sort((a, b) => {
    const scoreA =
      Number(a.expectedImpact?.revenue || 0) -
      Number(a.expectedImpact?.risk || 0) -
      Number(a.expectedImpact?.cost_of_adaptation || 0);
    const scoreB =
      Number(b.expectedImpact?.revenue || 0) -
      Number(b.expectedImpact?.risk || 0) -
      Number(b.expectedImpact?.cost_of_adaptation || 0);
    return scoreB - scoreA;
  });
}
