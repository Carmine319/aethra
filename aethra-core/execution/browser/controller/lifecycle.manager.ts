export async function safeClose(context: any) {
  try {
    if (context && typeof context.close === "function") {
      await context.close();
    }
  } catch (e) {
    console.error("Context close failure", e);
  }
}

export async function safeClosePage(page: any) {
  try {
    if (page && typeof page.close === "function") {
      await page.close();
    }
  } catch (e) {
    console.error("Page close failure", e);
  }
}

export function shouldReuseSession(lastUsedAt: number, maxIdleMs: number): boolean {
  if (!Number.isFinite(lastUsedAt)) return false;
  return Date.now() - Number(lastUsedAt) <= Math.max(0, Number(maxIdleMs || 0));
}
