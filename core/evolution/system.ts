import * as fs from "fs";
import * as path from "path";
import { getRepoRoot } from "../repoPaths";
import { deriveInsights } from "../memory/engine";
import { rankTemplates } from "../templates/evolution";

const ADAPTIVE_FILE = path.join(getRepoRoot(), "core", "evolution", "adaptive_weights.json");

export interface AdaptiveState {
  signalWeightInternal: number;
  signalWeightExternal: number;
  templateBias: Record<string, number>;
  capitalDeployFrac: number;
  updatedAt: number;
}

function loadAdaptive(): AdaptiveState {
  try {
    const j = JSON.parse(fs.readFileSync(ADAPTIVE_FILE, "utf8"));
    return {
      signalWeightInternal: Number(j.signalWeightInternal) || 1,
      signalWeightExternal: Number(j.signalWeightExternal) || 1,
      templateBias: j.templateBias && typeof j.templateBias === "object" ? j.templateBias : {},
      capitalDeployFrac: Number(j.capitalDeployFrac) || 0.12,
      updatedAt: Number(j.updatedAt) || 0,
    };
  } catch {
    return {
      signalWeightInternal: 1,
      signalWeightExternal: 1,
      templateBias: {},
      capitalDeployFrac: 0.12,
      updatedAt: 0,
    };
  }
}

export function getAdaptiveState(): AdaptiveState {
  return loadAdaptive();
}

/**
 * Tighten waste, bias toward faster cash templates, nudge capital frac down on friction.
 */
export async function evolveSystem(): Promise<AdaptiveState> {
  const prev = loadAdaptive();
  const insights = deriveInsights();
  const ranked = rankTemplates();
  const next: AdaptiveState = { ...prev, templateBias: { ...prev.templateBias }, updatedAt: Date.now() };

  if (insights.failureCorrelations.length >= 3) {
    next.capitalDeployFrac = Math.max(0.06, prev.capitalDeployFrac * 0.92);
    next.signalWeightExternal = Math.min(1.4, prev.signalWeightExternal * 1.05);
  }

  if (insights.winningTemplates.length) {
    next.signalWeightInternal = Math.min(1.25, prev.signalWeightInternal * 1.02);
    for (const id of insights.winningTemplates) {
      next.templateBias[id] = Math.min(0.35, (next.templateBias[id] || 0) + 0.04);
    }
  }

  for (let i = 0; i < ranked.length; i++) {
    const id = ranked[i].id;
    if (i > ranked.length - 2 && ranked[i].stats.decay > 0.1) {
      next.templateBias[id] = Math.max(-0.25, (next.templateBias[id] || 0) - 0.06);
    }
  }

  try {
    fs.mkdirSync(path.dirname(ADAPTIVE_FILE), { recursive: true });
    fs.writeFileSync(ADAPTIVE_FILE, JSON.stringify(next, null, 2), "utf8");
  } catch {
    /* ignore */
  }
  return next;
}
