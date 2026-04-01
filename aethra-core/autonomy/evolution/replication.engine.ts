import type { Genome } from "../genome/genome.registry";

export function replicate(genome: Genome) {
  return {
    ...genome,
    id: `${genome.id}_replica_${Date.now()}`,
    strategy: {
      ...genome.strategy,
      replicated_from: genome.id,
    },
  };
}
