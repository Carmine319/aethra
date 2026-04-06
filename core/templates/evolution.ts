import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { getRepoRoot } from "../repoPaths";

const nodeRequire = createRequire(__filename);

export interface TemplateStats {
  id: string;
  successRate: number;
  avgTimeToRevenue: number;
  avgROI: number;
  failureModes: Record<string, number>;
  adaptabilityScore: number;
  decay: number;
}

const CLONES_FILE = path.join(getRepoRoot(), "core", "templates", "template_clones.json");

function performancePath(): string {
  return path.join(getRepoRoot(), "core", "templates", "template_performance.json");
}

function loadPerf(): Record<string, { score?: number; n?: number }> {
  try {
    const j = JSON.parse(fs.readFileSync(performancePath(), "utf8"));
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

function loadHistoryTemplateCounts(): { failures: Record<string, number>; wins: Record<string, number>; times: Record<string, number[]> } {
  const failures: Record<string, number> = {};
  const wins: Record<string, number> = {};
  const times: Record<string, number[]> = {};
  try {
    const memPath = path.join(getRepoRoot(), "core", "memory", "organism_memory.json");
    const j = JSON.parse(fs.readFileSync(memPath, "utf8"));
    const log = Array.isArray(j.historicalLog) ? j.historicalLog : [];
    for (const row of log) {
      const tid = String(row.template_id || "");
      if (!tid) continue;
      if (row.kind === "deployment") {
        if (row.outcome === "kill") failures[tid] = (failures[tid] || 0) + 1;
        if (row.outcome === "strong" || row.outcome === "scale") wins[tid] = (wins[tid] || 0) + 1;
        if (typeof row.revenue_proxy === "number") {
          times[tid] = times[tid] || [];
          times[tid].push(row.revenue_proxy);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return { failures, wins, times };
}

export function computeTemplateStats(templateId: string, baseTimeToRevenue: number): TemplateStats {
  const perf = loadPerf()[templateId] || { score: 0, n: 0 };
  const { failures, wins, times } = loadHistoryTemplateCounts();
  const w = wins[templateId] || 0;
  const f = failures[templateId] || 0;
  const denom = w + f || 1;
  const successRate = w / denom;
  const arr = times[templateId] || [];
  const pScore = Number(perf.score) || 0;
  const pN = Number(perf.n) || 0;
  const avgROI = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : pN ? pScore / pN : 0;
  const failureModes: Record<string, number> = {};
  if (f) failureModes.kill = f;

  const perfBoost = pN ? Math.max(-2, Math.min(3, pScore / Math.max(1, pN))) : 0;
  const adaptabilityScore = Math.round(Math.min(100, 40 + successRate * 45 + perfBoost * 8));

  const decay = successRate < 0.25 && (w + f) >= 4 ? 0.15 : successRate > 0.55 ? 0 : 0.05;

  return {
    id: templateId,
    successRate: Math.round(successRate * 1000) / 1000,
    avgTimeToRevenue: baseTimeToRevenue,
    avgROI: Math.round(avgROI * 1000) / 1000,
    failureModes,
    adaptabilityScore,
    decay,
  };
}

export function rankTemplates(): Array<{ id: string; rankScore: number; stats: TemplateStats; def: Record<string, unknown> }> {
  const root = getRepoRoot();
  const { TEMPLATES } = nodeRequire(path.join(root, "core", "templates", "registry.js"));
  const list = TEMPLATES as Array<Record<string, unknown> & { id: string; time_to_revenue_days?: number }>;
  const ranked = list.map((t) => {
    const stats = computeTemplateStats(t.id, Number(t.time_to_revenue_days) || 21);
    const rankScore =
      stats.successRate * 3.2 +
      stats.adaptabilityScore / 35 -
      stats.decay * 4 -
      stats.avgTimeToRevenue / 80 +
      stats.avgROI * 0.8;
    return { id: t.id, rankScore: Math.round(rankScore * 1000) / 1000, stats, def: t };
  });
  ranked.sort((a, b) => b.rankScore - a.rankScore);
  return ranked;
}

export type CloneVariation = "pricing" | "channel" | "positioning";

export function cloneTemplate(
  templateId: string,
  variation: CloneVariation
): { ok: boolean; clone?: Record<string, unknown>; error?: string } {
  const root = getRepoRoot();
  const { TEMPLATES } = nodeRequire(path.join(root, "core", "templates", "registry.js"));
  const base = (TEMPLATES as Array<{ id: string }>).find((t) => t.id === templateId);
  if (!base) return { ok: false, error: "template_not_found" };

  const cloneId = `${templateId}_clone_${variation}_${Date.now().toString(36)}`;
  const clone = {
    ...base,
    id: cloneId,
    parent_id: templateId,
    variation,
    name: `${(base as { name?: string }).name || templateId} (${variation})`,
    ...(variation === "pricing"
      ? {
          cost_structure: {
            ...(base as { cost_structure?: object }).cost_structure,
            fixed_gbp: Math.round(((base as { cost_structure?: { fixed_gbp?: number } }).cost_structure?.fixed_gbp || 150) * 1.08 * 100) / 100,
          },
        }
      : {}),
    ...(variation === "channel"
      ? { monetisation_hooks: [...((base as { monetisation_hooks?: string[] }).monetisation_hooks || []), "alternate_channel_test"] }
      : {}),
    ...(variation === "positioning"
      ? {
          executionSteps: [
            ...((base as { executionSteps?: string[] }).executionSteps || []).slice(0, -1),
            "positioning_ab_test",
          ],
        }
      : {}),
  };

  let clones: unknown[] = [];
  try {
    if (fs.existsSync(CLONES_FILE)) clones = JSON.parse(fs.readFileSync(CLONES_FILE, "utf8"));
    if (!Array.isArray(clones)) clones = [];
  } catch {
    clones = [];
  }
  clones.push({ created_at: Date.now(), clone });
  try {
    fs.mkdirSync(path.dirname(CLONES_FILE), { recursive: true });
    fs.writeFileSync(CLONES_FILE, JSON.stringify(clones, null, 2), "utf8");
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
  return { ok: true, clone };
}

export function selectTemplateForOpportunity(opportunityPayload: Record<string, unknown>): Record<string, unknown> & { id: string } {
  const ranked = rankTemplates();
  if (!ranked.length) {
    return { id: "local_service_fast", name: "fallback" } as Record<string, unknown> & { id: string };
  }
  const idea = String(opportunityPayload.idea || opportunityPayload.text || "").toLowerCase();
  let pick = ranked[0]?.def as (Record<string, unknown> & { id: string }) | undefined;
  if (idea.includes("b2b") || idea.includes("saas")) {
    const b2b = ranked.find((r) => r.id === "b2b_pilot_strict");
    if (b2b) pick = b2b.def as Record<string, unknown> & { id: string };
  }
  if (idea.includes("local")) {
    const loc = ranked.find((r) => r.id === "local_service_fast");
    if (loc) pick = loc.def as Record<string, unknown> & { id: string };
  }
  return pick || (ranked[0].def as Record<string, unknown> & { id: string });
}
