export type Step =
  | { type: "click"; selector: string }
  | { type: "type"; selector: string; value: string }
  | { type: "wait"; ms: number };

function validateSelector(selector: string) {
  const s = String(selector || "").trim();
  if (!s) throw new Error("Selector required");
  if (s.length > 300) throw new Error("Selector too long");
  if (/[{};]/.test(s)) throw new Error("Selector contains restricted characters");
}

export async function executeSteps(page: any, steps: Step[]) {
  for (const step of steps || []) {
    if (step.type === "click") {
      validateSelector(step.selector);
      await page.click(step.selector);
    }
    if (step.type === "type") {
      validateSelector(step.selector);
      await page.fill(step.selector, String(step.value || ""));
    }
    if (step.type === "wait") {
      await page.waitForTimeout(Math.max(0, Number(step.ms || 0)));
    }
  }
}
