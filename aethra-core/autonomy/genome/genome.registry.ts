export type Genome = {
  id: string;
  performance: number;
  strategy: Record<string, unknown>;
  version?: number;
};

const genomes: Genome[] = [];

export function registerGenome(g: Genome) {
  genomes.push(g);
}

export function getGenomes(): Genome[] {
  return [...genomes];
}
