import { chromium, type BrowserContext } from "playwright";

export async function launchBrowser(sessionId: string): Promise<BrowserContext> {
  const context = await chromium.launchPersistentContext(`./sessions/${sessionId}`, {
    headless: false,
    viewport: null,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
  });

  context.setDefaultTimeout(30000);
  return context;
}
