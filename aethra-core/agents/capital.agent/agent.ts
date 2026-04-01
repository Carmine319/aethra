/**
 * Capital agent — SCS boundary + Ω foundation allocate() (reserve + ROI rules).
 */
import type { AgentSlug } from "../handoff.protocol";

export const AGENT_SLUG: AgentSlug = "capital";

export type OpportunityAllocationInput = {
  validated?: boolean;
  roi: number;
  id?: string;
  [key: string]: unknown;
};

export type AllocatedOpportunity = OpportunityAllocationInput & {
  allocation: number;
  status?: string;
};

const DEFAULT_RESERVE_RATIO = 0.35;

/**
 * Reserve-first deployment: probe unvalidated, scale winners, kill sub-1 ROI.
 */
export function allocate(
  opportunities: OpportunityAllocationInput[],
  capital: number,
  reserveRatio: number = DEFAULT_RESERVE_RATIO
): AllocatedOpportunity[] {
  const reserve = capital * reserveRatio;
  const deployable = Math.max(0, capital - reserve);

  return opportunities.map((o) => {
    if (!o.validated) {
      return { ...o, allocation: deployable * 0.02 };
    }
    if (o.roi >= 2) {
      return { ...o, allocation: deployable * 0.3 };
    }
    if (o.roi < 1) {
      return { ...o, allocation: 0, status: "killed" };
    }
    return { ...o, allocation: deployable * 0.1 };
  });
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

export type {
  SkillTask,
  SkillExecutionResult,
  ConstraintActionContext,
  ExecutionAgentRuntime,
  ExecutionTask,
} from "../skill.engine";
