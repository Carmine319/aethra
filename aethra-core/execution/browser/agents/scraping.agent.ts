import { executeSocialTask } from "./social.agent";

export async function executeScrapingTask(task: any) {
  const enriched = {
    ...task,
    actionType: task.actionType || "scrape",
    risk: task.risk || "high",
  };
  return executeSocialTask(enriched);
}
