export type ToolCapability = {
  name: string;
  available: boolean;
  speed: number;
  cost: number;
  quality: number;
  tasks: string[];
};

export type ToolTask = {
  type: string;
  minQuality?: number;
};

const DEFAULT_TOOLS: ToolCapability[] = [
  { name: "native-generator", available: true, speed: 9, cost: 1, quality: 7, tasks: ["content", "landing", "brand", "video"] },
  { name: "premium-generator", available: true, speed: 6, cost: 5, quality: 9, tasks: ["content", "landing", "brand", "video"] },
  { name: "fallback-template", available: true, speed: 10, cost: 1, quality: 6, tasks: ["content", "landing", "brand", "video"] },
];

function scoreTool(tool: ToolCapability, minQuality: number): number {
  const qualityGate = tool.quality >= minQuality ? 1 : 0;
  if (!qualityGate) return -1;
  return tool.speed * 0.45 + (10 - tool.cost) * 0.4 + tool.quality * 0.15;
}

export function selectBestTool(task: ToolTask, tools: ToolCapability[] = DEFAULT_TOOLS): ToolCapability {
  const targetTask = String(task.type || "content");
  const minQuality = Number(task.minQuality || 6);
  const candidates = tools
    .filter((t) => t.available && t.tasks.includes(targetTask))
    .map((t) => ({ tool: t, score: scoreTool(t, minQuality) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length) return candidates[0].tool;

  const fallback = tools
    .filter((t) => t.available)
    .sort((a, b) => (b.speed - b.cost) - (a.speed - a.cost))[0];

  return fallback || { name: "hardcoded-fallback", available: true, speed: 10, cost: 1, quality: 5, tasks: [targetTask] };
}
