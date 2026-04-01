import { executeSteps, type Step } from "./interaction.engine";

export async function runYouTubeSkill(page: any, task: any) {
  const query = String(task.query || task.content || "");
  const steps: Step[] = [
    { type: "click", selector: 'input#search' },
    { type: "type", selector: 'input#search', value: query },
    { type: "click", selector: "button#search-icon-legacy" },
    { type: "wait", ms: 1000 },
  ];
  await executeSteps(page, steps);
  return { ok: true, platform: "youtube", executed_steps: steps.length };
}
