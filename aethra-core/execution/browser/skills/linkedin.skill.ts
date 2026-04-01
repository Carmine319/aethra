import { executeSteps, type Step } from "./interaction.engine";

export async function runLinkedInSkill(page: any, task: any) {
  const content = String(task.content || "");
  const steps: Step[] = [
    { type: "click", selector: ".share-box-feed-entry__trigger" },
    { type: "type", selector: ".ql-editor", value: content },
    { type: "click", selector: ".share-actions__primary-action" },
    { type: "wait", ms: 800 },
  ];
  await executeSteps(page, steps);
  return { ok: true, platform: "linkedin", executed_steps: steps.length };
}
