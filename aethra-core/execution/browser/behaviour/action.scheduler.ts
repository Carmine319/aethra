import { getHumanDelay } from "./timing.model";
import { enforceRateLimit } from "../safety/rate.limiter";
import { detectAnomaly } from "../safety/anomaly.detector";
import { trace, audit } from "../telemetry/tracer";

type SchedulerState = {
  paused: boolean;
};

const stateByWorkflow = new Map<string, SchedulerState>();

function getState(workflowId: string): SchedulerState {
  const current = stateByWorkflow.get(workflowId) || { paused: false };
  stateByWorkflow.set(workflowId, current);
  return current;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

export function pauseWorkflow(workflowId: string) {
  getState(workflowId).paused = true;
}

export function resumeWorkflow(workflowId: string) {
  getState(workflowId).paused = false;
}

export async function scheduleActions(
  steps: any[],
  page: any,
  opts: { workflowId: string; tenantId: string; sessionId: string; seed?: number; delayMultiplier?: number }
) {
  const workflowId = String(opts.workflowId || "workflow_default");
  const tenantKey = `${opts.tenantId}:${opts.sessionId}`;
  const list = Array.isArray(steps) ? steps : [];
  detectAnomaly({ actions: list.length, steps: list });

  for (let i = 0; i < list.length; i++) {
    const step = list[i];
    const status = getState(workflowId);
    while (status.paused) {
      await sleep(150);
    }

    enforceRateLimit(tenantKey, 40);
    const delay = getHumanDelay(String(step.type || "click"), { seed: opts.seed, seq: i });
    const effectiveDelay = Math.round(delay * Math.max(0.2, Number(opts.delayMultiplier || 1)));
    await sleep(effectiveDelay);

    if (step.type === "click") await page.click(step.selector);
    if (step.type === "type") await page.fill(step.selector, String(step.value || ""));
    if (step.type === "wait") await page.waitForTimeout(Math.max(0, Number(step.ms || 0)));

    trace("scheduled_action", {
      workflow_id: workflowId,
      action_type: step.type,
      delay_ms: effectiveDelay,
      step_index: i,
    });
    audit("scheduled_action", {
      workflow_id: workflowId,
      tenant_id: opts.tenantId,
      session_id: opts.sessionId,
      step,
      delay_ms: effectiveDelay,
      step_index: i,
    });
  }
}
