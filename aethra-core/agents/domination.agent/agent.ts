/**
 * Domination agent — SCS boundary for domination.loop.
 */
import type { AgentSlug } from "../handoff.protocol";

export const AGENT_SLUG: AgentSlug = "domination";

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
