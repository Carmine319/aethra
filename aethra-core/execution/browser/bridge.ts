export type BrowserTask = {
  taskId?: string;
  idea: string;
  actions?: string[];
  context?: Record<string, unknown>;
};

export async function executeBrowserTask(task: BrowserTask) {
  const actions = Array.isArray(task.actions) && task.actions.length
    ? task.actions
    : ["open-target", "apply-template", "publish-offer"];
  return {
    ok: true,
    taskId: task.taskId || `task_${Date.now()}`,
    idea: task.idea,
    status: "executed",
    actions,
    executedAt: Date.now(),
  };
}

export async function executeOpportunity(opportunity: Record<string, unknown>) {
  const opp = opportunity && typeof opportunity === "object" ? opportunity : {};
  return executeBrowserTask({
    idea: String((opp.name || opp.idea || "opportunity") as string),
    actions: ["post-content", "send-outreach", "create-listings", "drive-traffic"],
    context: {
      category: (opp.category || "safe") as string,
      execution_path: (opp.executionPath || []) as unknown[],
    },
  });
}
