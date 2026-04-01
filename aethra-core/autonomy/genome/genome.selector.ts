import type { Genome } from "./genome.registry";

export function selectTopGenomes(genomes: Genome[]) {
  return [...(genomes || [])].sort((a, b) => Number(b.performance || 0) - Number(a.performance || 0)).slice(0, 5);
}
