"use strict";

async function executeBrowserTask(task) {
  const actions = Array.isArray(task && task.actions) && task.actions.length
    ? task.actions
    : ["open-target", "apply-template", "publish-offer"];
  return {
    ok: true,
    taskId: (task && task.taskId) || `task_${Date.now()}`,
    idea: task && task.idea ? task.idea : "",
    status: "executed",
    actions,
    executedAt: Date.now(),
  };
}

async function executeOpportunity(opportunity) {
  const opp = opportunity && typeof opportunity === "object" ? opportunity : { name: String(opportunity || "") };
  return executeBrowserTask({
    idea: String(opp.name || opp.idea || "opportunity"),
    actions: ["post-content", "send-outreach", "create-listings", "drive-traffic"],
    context: { category: opp.category || "safe", execution_path: opp.executionPath || [] },
  });
}

module.exports = { executeBrowserTask, executeOpportunity };
