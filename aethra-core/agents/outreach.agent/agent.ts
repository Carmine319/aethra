/**
 * Outreach agent — SCS boundary + Ω direct-response message generation.
 */
import { callLLM } from "../../llm/openrouter.client";
import type { AgentSlug } from "../handoff.protocol";

export const AGENT_SLUG: AgentSlug = "outreach";

export async function generateMessage(offer: string, audience: string): Promise<string> {
  return callLLM(
    [
      "Write a DIRECT RESPONSE message:",
      "",
      "- clear outcome",
      "- no fluff",
      "- CTA included",
      "",
      `Offer: ${offer}`,
      `Audience: ${audience}`,
    ].join("\n")
  );
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
