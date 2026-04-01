import { runXSkill } from "./x.skill";
import { runLinkedInSkill } from "./linkedin.skill";
import { runYouTubeSkill } from "./youtube.skill";
import { runGenericSkill } from "./generic.skill";

export async function routePlatformTask(page: any, task: any) {
  const p = String(task.platform || "").toLowerCase();
  if (p === "x" || p === "twitter") return runXSkill(page, task);
  if (p === "linkedin") return runLinkedInSkill(page, task);
  if (p === "youtube") return runYouTubeSkill(page, task);
  return runGenericSkill(page, task);
}
