import { getSessionContext } from "../session/session.manager";
import { validateSession } from "../session/session.validator";
import { validateTask } from "../safety/guard";
import { detectAnomaly } from "../safety/anomaly.detector";
import { enforceRateLimit } from "../safety/rate.limiter";
import { sandboxCheck } from "../safety/sandbox.guard";
import { assertKillSwitchAllowsExecution } from "../safety/kill.switch";
import { requiresApproval, assertApproved } from "../safety/approval.gateway";
import { getOrCreatePage, prepareContext } from "../controller/context.factory";
import { safeClosePage } from "../controller/lifecycle.manager";
import { routePlatformTask } from "../skills/platform.router";
import { audit, trace } from "../telemetry/tracer";
import { incrementMetric } from "../telemetry/metrics";

export async function executeSocialTask(task: any) {
  assertKillSwitchAllowsExecution();
  validateTask(task);
  validateSession(task.sessionId);
  detectAnomaly(task);
  enforceRateLimit(`${task.tenantId}:${task.sessionId}`, 40);
  sandboxCheck(String(task.url || ""));

  const needsApproval = requiresApproval(String(task.actionType || "post"), task.risk || "low");
  if (needsApproval) {
    assertApproved(!!task.approvedByHuman, "high/critical action");
  }

  let page: any = null;
  const context = await getSessionContext(task.tenantId, task.sessionId, { reuseMaxIdleMs: 15 * 60_000 });
  try {
    await prepareContext(context);
    page = await getOrCreatePage(context);
    if (task.url) await page.goto(String(task.url), { waitUntil: "domcontentloaded" });
    trace("social_task_start", { tenantId: task.tenantId, platform: task.platform, risk: task.risk || "low" });
    const result = await routePlatformTask(page, task);
    incrementMetric("actions", Number(task.actions || 1));
    audit("social_task_success", { task, result });
    return { ok: true, ...result };
  } catch (e: any) {
    incrementMetric("failures", 1);
    audit("social_task_failure", { task, message: String(e?.message || e) });
    throw e;
  } finally {
    await safeClosePage(page);
  }
}
