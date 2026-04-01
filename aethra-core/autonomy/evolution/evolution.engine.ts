import type { Genome } from "../genome/genome.registry";
import { mutateGenome } from "../genome/genome.mutator";
import { selectTopGenomes } from "../genome/genome.selector";
import { replicate } from "./replication.engine";
import { prune } from "./pruning.engine";
import { saveVersion } from "../genome/genome.versioning";

export function evolve(genomes: Genome[]) {
  const top = selectTopGenomes(genomes);
  const mutated = top.map((g) => mutateGenome(g, { seed: g.id }));
  const replicated = mutated.map((g) => replicate(g));
  const next = prune([...mutated, ...replicated]);
  next.forEach((g) => {
    saveVersion(g);
  });
  return next;
}
