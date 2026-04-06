import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { getRepoRoot } from "../repoPaths";

const nodeRequire = createRequire(__filename);

export interface MemoryInsight {
  winningTemplates: string[];
  failureCorrelations: Array<{ template_id: string; outcome: string; count: number }>;
  clusters: string[];
  deltaExpectationNotes: string[];
}

function loadMemory(): { historicalLog: Array<Record<string, unknown>> } {
  const p = path.join(getRepoRoot(), "core", "memory", "organism_memory.json");
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    return { historicalLog: Array.isArray(j.historicalLog) ? j.historicalLog : [] };
  } catch {
    return { historicalLog: [] };
  }
}

export function deriveInsights(): MemoryInsight {
  const { historicalLog } = loadMemory();
  const recent = historicalLog.slice(-400);
  const templateWins: Record<string, number> = {};
  const templateFails: Record<string, number> = {};
  const correlations: Record<string, number> = {};

  for (const row of recent) {
    if (row.kind !== "deployment") continue;
    const tid = String(row.template_id || "");
    if (!tid) continue;
    const o = String(row.outcome || "");
    if (o === "strong" || o === "scale") templateWins[tid] = (templateWins[tid] || 0) + 1;
    if (o === "kill") {
      templateFails[tid] = (templateFails[tid] || 0) + 1;
      const k = `${tid}:${o}`;
      correlations[k] = (correlations[k] || 0) + 1;
    }
  }

  const winningTemplates = Object.entries(templateWins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id);

  const failureCorrelations = Object.entries(correlations).map(([key, count]) => {
    const [template_id, outcome] = key.split(":");
    return { template_id, outcome, count };
  });

  const clusters = winningTemplates.map((id) => `template_cluster:${id}`);

  const deltaNotes: string[] = [];
  for (const row of recent.slice(-30)) {
    if (row.kind === "deployment" && row.revenue_proxy != null && Number(row.revenue_proxy) === 0) {
      deltaNotes.push("Zero-yield deployment observed — tighten capital gate or template.");
      break;
    }
  }

  return {
    winningTemplates,
    failureCorrelations,
    clusters,
    deltaExpectationNotes: deltaNotes,
  };
}

export async function updateMemoryRecord(entry: Record<string, unknown>): Promise<void> {
  const { appendHistorical } = nodeRequire(path.join(getRepoRoot(), "core", "memory", "store.js")) as {
    appendHistorical: (e: Record<string, unknown>) => void;
  };
  appendHistorical(entry);
}
