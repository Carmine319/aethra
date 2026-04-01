import type { Genome } from "./genome.registry";

function pseudoRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000003;
  return (h % 10000) / 10000;
}

export function mutateGenome(genome: Genome, opts?: { seed?: string }): Genome {
  const seed = String(opts?.seed || `${genome.id}:${Date.now()}`);
  const delta = (pseudoRandom(seed) - 0.5) * 0.2;
  const nextPerformance = Math.max(-9999, Number(genome.performance || 0) + delta);
  return {
    ...genome,
    performance: nextPerformance,
    strategy: {
      ...genome.strategy,
      variation: delta,
      reversible: true,
    },
  };
}
