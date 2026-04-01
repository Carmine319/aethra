export type LoopStatus = "pending" | "running" | "scaled" | "optimise" | "killed";

export type RevenueLoop = {
  name: string;
  active: boolean;
  status?: LoopStatus;
  run: () => Promise<{ revenue: number; conversions?: number; metadata?: Record<string, unknown> }>;
  maxRunsPerSession?: number;
  runsCompleted?: number;
};

const loops: RevenueLoop[] = [];

export function registerLoop(loop: RevenueLoop) {
  loops.push(loop);
}

export function getActiveLoops(): RevenueLoop[] {
  return loops.filter((l) => l.active);
}

export function getAllLoops(): RevenueLoop[] {
  return [...loops];
}
