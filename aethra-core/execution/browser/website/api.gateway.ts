import { verifyUserSession, assertAttributableOwner } from "./auth.bridge";
import { enqueue } from "../orchestration/task.queue";
import { audit, trace } from "../telemetry/tracer";

export async function receiveTask(req: any) {
  const body = req && req.body && typeof req.body === "object" ? req.body : {};
  const authToken = String((req && req.headers && req.headers.authorization) || body.token || "");
  verifyUserSession(authToken.replace(/^Bearer\s+/i, ""));

  const sessionId = String(body.sessionId || "");
  const ownerId = assertAttributableOwner(String(body.ownerId || ""));
  const task = body.task && typeof body.task === "object" ? body.task : null;

  if (!sessionId) throw new Error("Unauthenticated");
  if (!task) throw new Error("Task payload missing");

  const accepted = enqueue({
    ownerId,
    sessionId,
    task,
    intentSignature: String(body.intentSignature || ""),
    intentTs: Number(body.intentTs || Date.now()),
  });

  trace("website_task_accepted", { task_id: accepted.taskId, owner_id: ownerId, session_id: sessionId });
  audit("website_task_accepted", {
    task_id: accepted.taskId,
    owner_id: ownerId,
    session_id: sessionId,
    task_type: String(task.actionType || "unknown"),
  });

  return {
    accepted: true,
    taskId: accepted.taskId,
  };
}
