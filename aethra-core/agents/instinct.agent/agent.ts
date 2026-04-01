/**
 * Instinct agent — SCS boundary + Ω LLM hypothesis generation (monetisation filter at source).
 */
import { callLLM } from "../../llm/openrouter.client";
import type { AgentSlug } from "../handoff.protocol";

export const AGENT_SLUG: AgentSlug = "instinct";

export type HypothesisSignals = unknown[];

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

/**
 * One-shot hypothesis with explicit economic constraints in the prompt (7-day revenue, low capital, clear buyer).
 */
export async function generateHypothesis(signals: HypothesisSignals): Promise<Record<string, unknown> | null> {
  const prompt = [
    "Identify ONE monetizable opportunity.",
    "",
    "Constraints:",
    "- must generate revenue within 7 days",
    "- must require low capital",
    "- must have clear buyer",
    "",
    "Signals:",
    JSON.stringify(signals),
    "",
    "Output strict JSON only, no markdown:",
    JSON.stringify({
      idea: "string",
      target_customer: "string",
      monetisation_path: "string",
      estimated_price: 0,
      confidence: 0,
    }),
  ].join("\n");

  const raw = await callLLM(prompt, "mistralai/mixtral-8x7b");
  return extractJsonObject(raw);
}

export {
  canAgentExecute,
  enforceConstraints,
  enforceExecution,
  logExecution,
  evolveSkills,
  guardAndTrace,
  loadSkillContract,
  loadConstraints,
  loadPerformance,
  renderSkillsMdFromJson,
} from "../skill.engine";

export type { SkillTask, SkillExecutionResult, ConstraintActionContext } from "../skill.engine";
