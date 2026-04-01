import { executeSocialTask } from "./social.agent";
import { audit, trace } from "../telemetry/tracer";

export async function runOrchestration(taskBundle: {
  tenantId: string;
  workflowId: string;
  tasks: any[];
}) {
  const out: any[] = [];
  trace("orchestration_start", {
    tenantId: taskBundle.tenantId,
    workflowId: taskBundle.workflowId,
    tasks: Array.isArray(taskBundle.tasks) ? taskBundle.tasks.length : 0,
  });

  for (const task of taskBundle.tasks || []) {
    const result = await executeSocialTask({ ...task, tenantId: taskBundle.tenantId });
    out.push(result);
  }

  audit("orchestration_complete", {
    tenantId: taskBundle.tenantId,
    workflowId: taskBundle.workflowId,
    completed: out.length,
  });
  return {
    ok: true,
    tenant_id: taskBundle.tenantId,
    workflow_id: taskBundle.workflowId,
    steps_completed: out.length,
    results: out,
  };
}

export async function runAutonomousFunnelExecution(input: {
  tenantId: string;
  sessionId: string;
  platform: string;
  landingUrl: string;
  postContent: string;
  dmTemplate: string;
}) {
  return runOrchestration({
    tenantId: input.tenantId,
    workflowId: `funnel_${Date.now()}`,
    tasks: [
      {
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        platform: input.platform,
        url: input.landingUrl,
        actionType: "post",
        risk: "low",
        content: input.postContent,
        actions: 3,
      },
      {
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        platform: input.platform,
        url: input.landingUrl,
        actionType: "dm",
        risk: "medium",
        content: input.dmTemplate,
        actions: 3,
      },
    ],
  });
}

export async function runDataExtractionLayer(input: {
  tenantId: string;
  sessionId: string;
  platform: string;
  targetUrl: string;
  steps: any[];
}) {
  return executeSocialTask({
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    platform: input.platform,
    url: input.targetUrl,
    actionType: "scrape",
    risk: "high",
    steps: input.steps,
    actions: Array.isArray(input.steps) ? input.steps.length : 0,
    approvedByHuman: true,
  });
}

export async function runGrowthLoopEngine(input: {
  tenantId: string;
  sessionId: string;
  platform: string;
  url: string;
  content: string;
}) {
  return runOrchestration({
    tenantId: input.tenantId,
    workflowId: `growth_loop_${Date.now()}`,
    tasks: [
      {
        sessionId: input.sessionId,
        platform: input.platform,
        url: input.url,
        actionType: "post",
        risk: "low",
        content: input.content,
        actions: 3,
      },
      {
        sessionId: input.sessionId,
        platform: input.platform,
        url: input.url,
        actionType: "comment",
        risk: "medium",
        steps: [{ type: "wait", ms: 1200 }],
        actions: 1,
      },
    ],
  });
}
