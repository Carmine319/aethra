import fs from "fs";
import path from "path";
import type { AgentSlug } from "./handoff.protocol";

const AGENTS_ROOT = path.join(__dirname);

function agentRoot(slug: AgentSlug): string {
  return path.join(AGENTS_ROOT, `${slug}.agent`);
}

export type SkillContract = {
  agent: string;
  capabilities: Array<{
    id: string;
    mapsTo: string;
    requiredInputFields: string[];
  }>;
  /** Ω foundation — string capabilities + economic guardrails (additive to SCS). */
  omegaFoundation?: {
    capabilityIds: string[];
    inputs: string[];
    outputs: string[];
    constraints: {
      min_reserve_ratio?: number;
      min_roi_threshold?: number;
      max_single_allocation?: number;
      require_validation?: boolean;
    };
  };
  decisionScope: string[];
  inputs: string[];
  outputs: string[];
  constraints: Record<string, unknown>;
  metrics: Record<string, unknown>;
  riskProfile: Record<string, unknown>;
  executionPolicy: {
    requiresValidation: boolean;
    maxParallelTasks: number;
    timeoutMs: number;
  };
};

export type ConstraintsFile = {
  legal: Record<string, unknown>;
  economic: {
    minROI?: number;
    mustHaveMonetisation?: boolean;
    maxLossPerTest?: number;
  };
  execution: Record<string, unknown>;
  reputation: {
    no_spam?: boolean;
    no_deception?: boolean;
  };
};

export type PerformanceFile = {
  totalExecutions: number;
  successfulExecutions: number;
  avgROI: number;
  conversionRate: number;
  lastUpdatedTs?: number;
};

export type SkillTask = {
  skill: string;
  input: Record<string, unknown>;
};

export type SkillExecutionResult = {
  agent: string;
  skill: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  result: "success" | "failure" | "aborted";
  roi?: number;
  error?: string;
};

export type ConstraintActionContext = {
  proposedSpendGbp?: number;
  monetisationPresent?: boolean;
  roiEstimate?: number;
  parallelTasks?: number;
};

/** Runtime agent profile for mandatory pre-flight (Ω foundation). */
export type ExecutionAgentRuntime = {
  capabilities: string[];
  constraints: {
    max_loss_per_opportunity: number;
  };
};

export type ExecutionTask = {
  type: string;
  cost: number;
  hasMonetisationPath: boolean;
};

/**
 * Throws on capability or economic breach — no silent undefined behaviour.
 */
export function enforceExecution(agent: ExecutionAgentRuntime, task: ExecutionTask): void {
  if (!agent.capabilities.includes(task.type)) {
    throw new Error("Capability violation");
  }
  if (task.cost > agent.constraints.max_loss_per_opportunity) {
    throw new Error("Economic constraint violation");
  }
  if (!task.hasMonetisationPath) {
    throw new Error("No monetisation path");
  }
}

export type CanExecuteResult =
  | { ok: true; capability: SkillContract["capabilities"][0]; contract: SkillContract }
  | { ok: false; reason: string };

/** mapsTo values must exist here for non-undefined execution paths. */
export const IMPLEMENTED_MAPS_TO: ReadonlySet<string> = new Set([
  "aethra-core/engine/capital.loop.runAethraCapital",
  "aethra-core/live/channels/outreach.engine.runOutreach",
  "aethra-core/creative/orchestration/pipeline.runner.runCreativePipeline",
  "aethra-core/execution/browser/bridge.executeBrowserTask",
  "aethra-core/conversion/orchestration/conversion.loop.runConversionLoop",
  "aethra-core/instinct/orchestration/instinct.loop.runInstinctLoop",
  "aethra-core/domination/orchestration/domination.loop.runDominationLoop",
]);

export function loadSkillContract(slug: AgentSlug): SkillContract {
  const file = path.join(agentRoot(slug), "skills.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as SkillContract;
}

export function loadConstraints(slug: AgentSlug): ConstraintsFile {
  const file = path.join(agentRoot(slug), "constraints.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as ConstraintsFile;
}

export function loadPerformance(slug: AgentSlug): PerformanceFile {
  const file = path.join(agentRoot(slug), "performance.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as PerformanceFile;
}

function writePerformance(slug: AgentSlug, perf: PerformanceFile): void {
  const file = path.join(agentRoot(slug), "performance.json");
  fs.writeFileSync(file, JSON.stringify({ ...perf, lastUpdatedTs: Date.now() }, null, 2), "utf8");
}

function evolutionPath(slug: AgentSlug): string {
  return path.join(agentRoot(slug), "evolution.log.jsonl");
}

function ensureAgentDir(slug: AgentSlug): void {
  const dir = agentRoot(slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const evo = evolutionPath(slug);
  if (!fs.existsSync(evo)) fs.writeFileSync(evo, "", "utf8");
}

export function canAgentExecute(slug: AgentSlug, task: SkillTask): CanExecuteResult {
  ensureAgentDir(slug);
  let contract: SkillContract;
  try {
    contract = loadSkillContract(slug);
  } catch (e) {
    return { ok: false, reason: `skills contract unreadable: ${String(e)}` };
  }

  if (contract.agent !== slug) {
    return { ok: false, reason: `agent mismatch: file declares ${contract.agent}, expected ${slug}` };
  }

  const capability = contract.capabilities.find((c) => c.id === task.skill);
  if (!capability) {
    return { ok: false, reason: `skill not in contract: ${task.skill}` };
  }

  if (!IMPLEMENTED_MAPS_TO.has(capability.mapsTo)) {
    return { ok: false, reason: `mapsTo not registered as implemented: ${capability.mapsTo}` };
  }

  for (const field of capability.requiredInputFields) {
    if (!(field in task.input) || task.input[field] === undefined) {
      return { ok: false, reason: `missing required input field: ${field}` };
    }
  }

  return { ok: true, capability, contract };
}

export type EnforceResult =
  | { ok: true }
  | { ok: false; violated: string; detail?: string };

export function enforceConstraints(slug: AgentSlug, action: ConstraintActionContext): EnforceResult {
  ensureAgentDir(slug);
  let c: ConstraintsFile;
  try {
    c = loadConstraints(slug);
  } catch (e) {
    return { ok: false, violated: "constraints", detail: String(e) };
  }

  const maxLoss = Number(c.economic?.maxLossPerTest ?? Infinity);
  if (action.proposedSpendGbp !== undefined && action.proposedSpendGbp > maxLoss) {
    return {
      ok: false,
      violated: "economic.maxLossPerTest",
      detail: `proposed ${action.proposedSpendGbp} exceeds maxLossPerTest ${maxLoss}`,
    };
  }

  if (c.economic?.mustHaveMonetisation && action.monetisationPresent === false) {
    return { ok: false, violated: "economic.mustHaveMonetisation", detail: "monetisation path required" };
  }

  const minRoi = Number(c.economic?.minROI ?? 0);
  if (action.roiEstimate !== undefined && action.roiEstimate < minRoi && action.roiEstimate > 0) {
    /* soft check: exit ROI below threshold is warning-only unless strict mode — abort scaling */
  }

  const contract = loadSkillContract(slug);
  const maxParallel = contract.executionPolicy?.maxParallelTasks ?? 5;
  if (action.parallelTasks !== undefined && action.parallelTasks > maxParallel) {
    return {
      ok: false,
      violated: "executionPolicy.maxParallelTasks",
      detail: `${action.parallelTasks} > ${maxParallel}`,
    };
  }

  return { ok: true };
}

export function logExecution(slug: AgentSlug, result: SkillExecutionResult): void {
  ensureAgentDir(slug);
  const perfPath = path.join(agentRoot(slug), "performance.json");
  let perf: PerformanceFile = {
    totalExecutions: 0,
    successfulExecutions: 0,
    avgROI: 0,
    conversionRate: 0,
  };
  try {
    perf = loadPerformance(slug);
  } catch {
    /* seed */
  }

  perf.totalExecutions += 1;
  if (result.result === "success") {
    perf.successfulExecutions += 1;
    if (result.roi !== undefined) {
      const s = perf.successfulExecutions;
      perf.avgROI = s <= 1 ? result.roi : (perf.avgROI * (s - 1) + result.roi) / s;
    }
  }

  writePerformance(slug, perf);

  const line = {
    ts: Date.now(),
    agent: slug,
    skill: result.skill,
    input: result.input,
    output: result.output,
    result: result.result,
    roi: result.roi,
    error: result.error,
  };
  fs.appendFileSync(evolutionPath(slug), JSON.stringify(line) + "\n", "utf8");
}

export type EvolutionProposal =
  | { action: "expand"; capabilityHint: string; reason: string }
  | { action: "restrict"; capabilityHint: string; reason: string }
  | { action: "deactivate"; capabilityId: string; reason: string }
  | { action: "maintain"; reason: string };

export function evolveSkills(slug: AgentSlug, performance?: PerformanceFile): EvolutionProposal {
  ensureAgentDir(slug);
  let perf: PerformanceFile;
  try {
    perf = performance ?? loadPerformance(slug);
  } catch {
    return { action: "maintain", reason: "no performance baseline" };
  }

  const total = perf.totalExecutions || 0;
  if (total < 3) return { action: "maintain", reason: "insufficient executions for evolution" };

  const rate = perf.successfulExecutions / total;

  if (total >= 10 && rate < 0.15) {
    const proposal: EvolutionProposal = {
      action: "deactivate",
      capabilityId: "riskiest_skill_pending_review",
      reason: `repeated failure cluster: success rate ${rate.toFixed(2)}`,
    };
    fs.appendFileSync(
      evolutionPath(slug),
      JSON.stringify({ ts: Date.now(), agent: slug, event: "evolution_proposal", ...proposal }) + "\n",
      "utf8"
    );
    return proposal;
  }

  if (rate >= 0.75 && (perf.avgROI >= 1.5 || perf.avgROI === 0)) {
    const proposal: EvolutionProposal = {
      action: "expand",
      capabilityHint: "adjacent_channel_or_offer_variant",
      reason: `high success rate ${rate.toFixed(2)}`,
    };
    fs.appendFileSync(
      evolutionPath(slug),
      JSON.stringify({ ts: Date.now(), agent: slug, event: "evolution_proposal", ...proposal }) + "\n",
      "utf8"
    );
    return proposal;
  }

  if (rate < 0.35) {
    const proposal: EvolutionProposal = {
      action: "restrict",
      capabilityHint: "reduce_parallel_or_spend",
      reason: `low success rate ${rate.toFixed(2)}`,
    };
    fs.appendFileSync(
      evolutionPath(slug),
      JSON.stringify({ ts: Date.now(), agent: slug, event: "evolution_proposal", ...proposal }) + "\n",
      "utf8"
    );
    return proposal;
  }

  return { action: "maintain", reason: "within band" };
}

/**
 * Abort-safe guard: validate contract + constraints before running impl.
 */
export function guardAndTrace(
  slug: AgentSlug,
  task: SkillTask,
  actionCtx: ConstraintActionContext,
  run: () => Promise<SkillExecutionResult> | SkillExecutionResult
): Promise<SkillExecutionResult> {
  const can = canAgentExecute(slug, task);
  if (!can.ok) {
    const aborted: SkillExecutionResult = {
      agent: slug,
      skill: task.skill,
      input: task.input,
      output: {},
      result: "aborted",
      error: can.reason,
    };
    logExecution(slug, aborted);
    return Promise.resolve(aborted);
  }

  const enc = enforceConstraints(slug, actionCtx);
  if (!enc.ok) {
    const aborted: SkillExecutionResult = {
      agent: slug,
      skill: task.skill,
      input: task.input,
      output: {},
      result: "aborted",
      error: `${enc.violated}: ${enc.detail ?? ""}`,
    };
    logExecution(slug, aborted);
    return Promise.resolve(aborted);
  }

  return Promise.resolve(run()).then((res) => {
    logExecution(slug, res);
    return res;
  });
}

/** Optional: generate human-readable skills.md from skills.json for sync. */
export function renderSkillsMdFromJson(slug: AgentSlug): string {
  const c = loadSkillContract(slug);
  const caps = c.capabilities.map((x) => `- **${x.id}** → \`${x.mapsTo}\``).join("\n");
  return [
    `# ${c.agent} — Skill Contract`,
    ``,
    `_Generated from skills.json — edit JSON as source of truth._`,
    ``,
    `## Core Capabilities`,
    caps,
    ``,
    `## Decision Scope`,
    ...c.decisionScope.map((d) => `- ${d}`),
    ``,
    `## Inputs`,
    ...c.inputs.map((i) => `- ${i}`),
    ``,
    `## Outputs`,
    ...c.outputs.map((o) => `- ${o}`),
    ``,
    `## Execution Policy`,
    `- requiresValidation: ${c.executionPolicy.requiresValidation}`,
    `- maxParallelTasks: ${c.executionPolicy.maxParallelTasks}`,
    `- timeoutMs: ${c.executionPolicy.timeoutMs}`,
    ``,
  ].join("\n");
}
