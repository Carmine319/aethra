import { receiveTask } from "./api.gateway";
import { processQueue } from "../orchestration/task.queue";
import { runWorkflow } from "../orchestration/workflow.engine";
import { scheduleActions } from "../behaviour/action.scheduler";
import { buildSessionProfile, assertPlatformAllowed } from "../behaviour/session.profile";
import { getSessionContext } from "../session/session.manager";
import { getOrCreatePage, prepareContext } from "../controller/context.factory";
import { executeSocialTask } from "../agents/social.agent";
import { validateConnection } from "../network/connectivity.guard";
import { audit, trace } from "../telemetry/tracer";

type IntentRequest = {
  headers?: Record<string, string>;
  body?: {
    ownerId: string;
    sessionId: string;
    intentSignature?: string;
    intentTs?: number;
    task: {
      tenantId: string;
      platform: string;
      url?: string;
      actionType?: string;
      risk?: "low" | "medium" | "high" | "critical";
      approvedByHuman?: boolean;
      content?: string;
      steps?: any[];
      actions?: number;
    };
  };
};

function normalizeWorkflowTask(taskEnvelope: any) {
  const ownerId = String(taskEnvelope.ownerId || "");
  const sessionId = String(taskEnvelope.sessionId || "");
  const task = taskEnvelope.task && typeof taskEnvelope.task === "object" ? taskEnvelope.task : {};
  return {
    ownerId,
    sessionId,
    tenantId: String(task.tenantId || ownerId || "tenant_unknown"),
    platform: String(task.platform || "generic"),
    url: task.url ? String(task.url) : "",
    actionType: String(task.actionType || "post"),
    risk: (task.risk || "low") as "low" | "medium" | "high" | "critical",
    approvedByHuman: !!task.approvedByHuman,
    content: task.content ? String(task.content) : "",
    steps: Array.isArray(task.steps) ? task.steps : [],
    actions: Number(task.actions || 0),
  };
}

async function executeTaskEnvelope(taskEnvelope: any) {
  const task = normalizeWorkflowTask(taskEnvelope);
  const profile = buildSessionProfile(task.sessionId);
  assertPlatformAllowed(profile, task.platform);
  if (task.url) validateConnection(task.url);

  const context = await getSessionContext(task.tenantId, task.sessionId, { reuseMaxIdleMs: 15 * 60_000 });
  await prepareContext(context);
  const page = await getOrCreatePage(context);
  const workflowId = `wf_${task.tenantId}_${task.sessionId}_${Date.now()}`;

  const scheduledSteps = task.steps.length
    ? task.steps
    : [{ type: "wait", ms: 250 }]; // Maintain deterministic pipeline even for direct skill execution.

  await runWorkflow(
    {
      workflowId,
      idempotencyKey: `${task.tenantId}:${task.sessionId}:${task.actionType}:${task.url || "no_url"}`,
      steps: [{ type: "schedule_then_execute" }],
      rollback: [{ type: "wait", ms: 50 }],
    },
    async () => {
      await scheduleActions(scheduledSteps, page, {
        workflowId,
        tenantId: task.tenantId,
        sessionId: task.sessionId,
        seed: Date.now(),
        delayMultiplier: profile.avgDelayMultiplier,
      });
      await executeSocialTask(task);
    }
  );

  audit("control_plane_task_complete", {
    owner_id: task.ownerId,
    tenant_id: task.tenantId,
    session_id: task.sessionId,
    platform: task.platform,
    action_type: task.actionType,
  });
  return { ok: true, workflow_id: workflowId };
}

export async function executeSignedIntent(req: IntentRequest) {
  const accepted = await receiveTask(req);
  trace("control_plane_intent_accepted", { task_id: accepted.taskId });
  await processQueue(async (queuedTask) => {
    await executeTaskEnvelope(queuedTask);
  });
  return {
    ok: true,
    accepted,
    processed: true,
  };
}
