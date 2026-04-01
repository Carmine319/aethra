import type { Genome } from "../genome/genome.registry";

export function prune(genomes: Genome[]) {
  return (genomes || []).filter((g) => Number(g.performance || 0) > 0);
}
