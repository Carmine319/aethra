/**
 * Skill Contract System (SCS) — public export surface for governed agents.
 */
export type { AgentSlug } from "./handoff.protocol";
export {
  HANDOFF_NEXT,
  canHandoff,
  assertHandoff,
} from "./handoff.protocol";

export {
  IMPLEMENTED_MAPS_TO,
  loadSkillContract,
  loadConstraints,
  loadPerformance,
  canAgentExecute,
  enforceConstraints,
  enforceExecution,
  logExecution,
  evolveSkills,
  guardAndTrace,
  renderSkillsMdFromJson,
} from "./skill.engine";

export type {
  SkillContract,
  ConstraintsFile,
  PerformanceFile,
  SkillTask,
  SkillExecutionResult,
  ConstraintActionContext,
  CanExecuteResult,
  EnforceResult,
  EvolutionProposal,
  ExecutionAgentRuntime,
  ExecutionTask,
} from "./skill.engine";

export { runAethraCoreFlow, fetchSignals } from "./orchestration/core.flow";
export type { AethraCoreFlowResult } from "./orchestration/core.flow";

export { AGENT_SLUG as CAPITAL_AGENT } from "./capital.agent/agent";
export { AGENT_SLUG as OUTREACH_AGENT } from "./outreach.agent/agent";
export { AGENT_SLUG as CREATIVE_AGENT } from "./creative.agent/agent";
export { AGENT_SLUG as EXECUTION_AGENT } from "./execution.agent/agent";
export { AGENT_SLUG as CONVERSION_AGENT } from "./conversion.agent/agent";
export { AGENT_SLUG as INSTINCT_AGENT } from "./instinct.agent/agent";
export { AGENT_SLUG as DOMINATION_AGENT } from "./domination.agent/agent";
