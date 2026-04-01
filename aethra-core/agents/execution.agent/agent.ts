/**
 * Execution agent — SCS boundary + Ω landing/checkout surface contract.
 */
import type { AgentSlug } from "../handoff.protocol";

export const AGENT_SLUG: AgentSlug = "execution";

export type DeployOfferInput = {
  slug: string;
  price?: number;
  [key: string]: unknown;
};

export type DeployLandingResult = {
  url: string;
  checkout: string;
  status: "live";
};

/**
 * Refuses non-monetizable offers (no price → no deployment).
 */
export function deployLanding(offer: DeployOfferInput): DeployLandingResult {
  if (offer.price === undefined || offer.price === null || Number(offer.price) <= 0) {
    throw new Error("Offer not monetizable");
  }
  const slug = String(offer.slug || "offer");
  return {
    url: `/landing/${slug}`,
    checkout: `/checkout/${slug}`,
    status: "live",
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
