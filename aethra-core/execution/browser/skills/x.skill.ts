import { executeSteps, type Step } from "./interaction.engine";

export async function runXSkill(page: any, task: any) {
  const content = String(task.content || "");
  const steps: Step[] = [
    { type: "click", selector: '[data-testid="SideNav_NewTweet_Button"]' },
    { type: "type", selector: '[data-testid="tweetTextarea_0"]', value: content },
    { type: "click", selector: '[data-testid="tweetButtonInline"]' },
    { type: "wait", ms: 800 },
  ];
  await executeSteps(page, steps);
  return { ok: true, platform: "x", executed_steps: steps.length };
}
