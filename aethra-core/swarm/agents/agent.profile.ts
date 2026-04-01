export type SwarmRole =
  | "creator"
  | "seller"
  | "optimiser"
  | "scout"
  | "arbitrage"
  | "allocator";

export type AgentProfile = {
  role: SwarmRole;
  capital?: number;
  genome?: Record<string, unknown> | null;
  ownerId?: string;
  /** Expected utility / ROI contribution (required for swarm spawn). */
  expectedUtility: number;
};
