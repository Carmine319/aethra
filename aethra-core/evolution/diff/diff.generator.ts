import type { EvolutionProposal } from "../proposals/proposal.schema";

export function generateDiff(fromState: Record<string, unknown>, proposal: EvolutionProposal) {
  return {
    proposal_id: proposal.id,
    from_keys: Object.keys(fromState || {}),
    delta: {
      add: [] as string[],
      remove: [] as string[],
      modify: [proposal.description],
    },
  };
}
