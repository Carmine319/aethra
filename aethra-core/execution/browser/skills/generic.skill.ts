import { executeSteps, type Step } from "./interaction.engine";

export async function runGenericSkill(page: any, task: any) {
  const steps = Array.isArray(task.steps) ? (task.steps as Step[]) : [];
  await executeSteps(page, steps);
  return { ok: true, platform: "generic", executed_steps: steps.length };
}
