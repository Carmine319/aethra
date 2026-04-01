import { runWithRetry, type RetryPolicy } from "./retry.policy";
import { audit, trace } from "../telemetry/tracer";

type Workflow = {
  workflowId: string;
  idempotencyKey: string;
  steps: any[];
  rollback?: any[];
};

const checkpoints = new Map<string, number>();
const completed = new Set<string>();

export function getCheckpoint(workflowId: string): number {
  return checkpoints.get(workflowId) || 0;
}

export async function runWorkflow(
  workflow: Workflow,
  executor: (step: any) => Promise<void>,
  opts?: { retryPolicy?: RetryPolicy }
) {
  if (completed.has(workflow.idempotencyKey)) {
    trace("workflow_idempotent_skip", {
      workflow_id: workflow.workflowId,
      idempotency_key: workflow.idempotencyKey,
    });
    return { ok: true, skipped: true, reason: "idempotent_replay" };
  }

  const startFrom = getCheckpoint(workflow.workflowId);
  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
  try {
    for (let i = startFrom; i < steps.length; i++) {
      const step = steps[i];
      await runWithRetry(() => executor(step), opts && opts.retryPolicy ? opts.retryPolicy : undefined);
      checkpoints.set(workflow.workflowId, i + 1);
      audit("workflow_checkpoint", {
        workflow_id: workflow.workflowId,
        idempotency_key: workflow.idempotencyKey,
        completed_steps: i + 1,
      });
    }
    completed.add(workflow.idempotencyKey);
    audit("workflow_complete", {
      workflow_id: workflow.workflowId,
      idempotency_key: workflow.idempotencyKey,
      total_steps: steps.length,
    });
    return { ok: true, completed_steps: steps.length };
  } catch (e: any) {
    audit("workflow_failure", {
      workflow_id: workflow.workflowId,
      message: String(e?.message || e),
      checkpoint: getCheckpoint(workflow.workflowId),
    });
    const rollback = Array.isArray(workflow.rollback) ? workflow.rollback : [];
    for (const rb of rollback) {
      try {
        await executor(rb);
      } catch {
        /* best effort rollback */
      }
    }
    throw e;
  }
}
