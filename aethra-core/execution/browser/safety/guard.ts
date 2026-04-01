export type BrowserTask = {
  tenantId: string;
  sessionId: string;
  platform: string;
  url?: string;
  risk?: "low" | "medium" | "high" | "critical";
  actions?: number;
  requiresApproval?: boolean;
};

export function validateTask(task: BrowserTask) {
  if (!task || typeof task !== "object") throw new Error("Task payload required");
  if (!task.tenantId || !task.sessionId) throw new Error("tenantId and sessionId are required");
  if (!task.platform) throw new Error("platform is required");
  if (task.actions != null && Number(task.actions) < 0) throw new Error("actions cannot be negative");
}
