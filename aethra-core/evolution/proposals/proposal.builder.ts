import type { EvolutionProposal } from "./proposal.schema";

export function buildProposal(partial: Omit<EvolutionProposal, "id" | "created_at"> & { id?: string }): EvolutionProposal {
  return {
    id: partial.id || `prop_${Date.now()}`,
    layer: partial.layer,
    description: partial.description,
    expectedImpact: partial.expectedImpact || { revenue: 0, risk: 0 },
    breaksCoreLogic: partial.breaksCoreLogic,
    irreversible: partial.irreversible,
    dependency_hints: partial.dependency_hints,
    created_at: Date.now(),
  };
}
