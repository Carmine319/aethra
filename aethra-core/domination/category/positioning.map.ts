export type PositioningMap = {
  frame: string;
  alternatives: string[];
  wedge: string;
};

export function buildPositioningMap(opportunity: Record<string, unknown>): PositioningMap {
  const segment = String(opportunity.segment || "operators");
  return {
    frame: `Decision infrastructure for ${segment}`,
    alternatives: ["generic agencies", "disconnected tools", "manual execution"],
    wedge: "integrated perception-to-capital control loop",
  };
}
