import type { BrowserContext, Page } from "playwright";

export async function getOrCreatePage(context: BrowserContext): Promise<Page> {
  const pages = context.pages();
  if (pages.length > 0) return pages[0];
  return context.newPage();
}

export async function prepareContext(context: BrowserContext): Promise<void> {
  context.setDefaultTimeout(30000);
  context.setDefaultNavigationTimeout(45000);
}
