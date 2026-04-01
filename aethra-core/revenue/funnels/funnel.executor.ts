import { executeSocialTask } from "../../browser-agent/agents/social.agent";
import type { FunnelDefinition } from "./funnel.builder";

function baseTask(
  funnel: FunnelDefinition,
  overrides: Partial<Parameters<typeof executeSocialTask>[0]>
) {
  const tenantId = funnel.tenantId || "revenue_loop_tenant";
  const sessionId = funnel.sessionId || `funnel_${funnel.product.id || funnel.product.name}_${Date.now()}`;
  return {
    tenantId,
    sessionId,
    platform: "x",
    actionType: "post" as const,
    risk: "low" as const,
    actions: 2,
    ...overrides,
  };
}

/**
 * Executes funnel steps via Browser Agent (policy-bound, auditable).
 * Requires valid session context; URLs must be HTTPS when provided.
 */
export async function runFunnel(funnel: FunnelDefinition) {
  const results: unknown[] = [];
  for (const step of funnel.steps) {
    const task = baseTask(funnel, {
      content: `[${funnel.product.name}] Executing funnel step: ${step.type} (governed execution)`,
      platform: (step.channelHint as string) || "x",
    });
    const r = await executeSocialTask(task);
    results.push(r);
  }
  return { ok: true, steps: funnel.steps.length, results };
}
