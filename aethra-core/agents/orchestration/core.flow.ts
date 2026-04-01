/**
 * Ω Core flow — capital-controlled, constraint-enforced, revenue-oriented composition.
 * Additive orchestration; does not replace engine/capital.loop.ts.
 */
import { allocate } from "../capital.agent/agent";
import { generateHypothesis } from "../instinct.agent/agent";
import { deployLanding } from "../execution.agent/agent";
import { generateMessage } from "../outreach.agent/agent";
import { optimisePricing } from "../conversion.agent/agent";
import { enforceExecution } from "../skill.engine";

/** Supply signals from intel / ingestion; default empty for unknown environment. */
export async function fetchSignals(): Promise<Array<Record<string, unknown>>> {
  return [];
}

const ORCHESTRATION_RUNTIME = {
  capabilities: ["pipeline_run", "allocate", "deploy", "message", "pricing"],
  constraints: { max_loss_per_opportunity: 500 },
};

export type AethraCoreFlowResult = {
  skipped?: boolean;
  reason?: string;
  hypothesis?: Record<string, unknown> | null;
  allocation?: ReturnType<typeof allocate>;
  landing?: ReturnType<typeof deployLanding>;
  message?: string;
  pricing?: ReturnType<typeof optimisePricing>;
};

/**
 * Production-grade skeleton: hypothesis → allocation → landing → message → pricing.
 * Requires OPENROUTER_API_KEY for LLM steps.
 */
export async function runAethraCoreFlow(seedCapital = 300): Promise<AethraCoreFlowResult> {
  const signals = await fetchSignals();
  const hypothesis = await generateHypothesis(signals);

  if (!hypothesis || !hypothesis.monetisation_path) {
    return { skipped: true, reason: "no_monetisation_path", hypothesis };
  }

  enforceExecution(ORCHESTRATION_RUNTIME, {
    type: "pipeline_run",
    cost: Math.min(seedCapital * 0.15, ORCHESTRATION_RUNTIME.constraints.max_loss_per_opportunity),
    hasMonetisationPath: true,
  });

  const estimated = Number(hypothesis.estimated_price ?? 0);
  const price = estimated > 0 ? estimated : 99;
  const idea = String(hypothesis.idea ?? "");
  const target = String(hypothesis.target_customer ?? "");

  const opportunities = [
    {
      ...hypothesis,
      validated: false,
      roi: Math.max(0.5, Math.min(3, Number(hypothesis.confidence ?? 1.2))),
    },
  ];

  const allocation = allocate(opportunities, seedCapital);

  const landing = deployLanding({
    slug: "offer-1",
    price,
  });

  const message = await generateMessage(idea, target);
  const pricing = optimisePricing(price);

  return { hypothesis, allocation, landing, message, pricing };
}
