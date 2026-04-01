export function detectAnomaly(task: any) {
  if (!task || typeof task !== "object") {
    throw new Error("Task required for anomaly check");
  }
  if (Number(task.actions || 0) > 50) {
    throw new Error("Anomalous behaviour detected");
  }
  if (Array.isArray(task.steps) && task.steps.length > 100) {
    throw new Error("Anomalous step volume detected");
  }
}
