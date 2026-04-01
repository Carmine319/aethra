/**
 * Conversion agent — SCS boundary + Ω pricing ladder extraction.
 */
import type { AgentSlug } from "../handoff.protocol";

export const AGENT_SLUG: AgentSlug = "conversion";

export type PricingLadder = {
  anchor: number;
  main: number;
  decoy: number;
  upsell: number;
};

export function optimisePricing(basePrice: number): PricingLadder {
  const base = Number(basePrice);
  if (!Number.isFinite(base) || base <= 0) {
    throw new Error("optimisePricing requires positive basePrice");
  }
  return {
    anchor: base * 3,
    main: base,
    decoy: base * 1.8,
    upsell: base * 2.5,
  };
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
