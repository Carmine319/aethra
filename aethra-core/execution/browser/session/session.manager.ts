import type { BrowserContext } from "playwright";
import { launchBrowser } from "../controller/browser.controller";
import { shouldReuseSession, safeClose } from "../controller/lifecycle.manager";
import { validateSession } from "./session.validator";
import { metrics } from "../telemetry/metrics";

type SessionEntry = {
  tenantId: string;
  sessionId: string;
  context: BrowserContext;
  lastUsedAt: number;
};

const sessions = new Map<string, SessionEntry>();

function key(tenantId: string, sessionId: string): string {
  return `${tenantId}::${sessionId}`;
}

export async function getSessionContext(
  tenantId: string,
  sessionId: string,
  policy: { reuseMaxIdleMs: number }
): Promise<BrowserContext> {
  validateSession(sessionId);
  const k = key(tenantId, sessionId);
  const existing = sessions.get(k);
  if (existing && shouldReuseSession(existing.lastUsedAt, policy.reuseMaxIdleMs)) {
    existing.lastUsedAt = Date.now();
    return existing.context;
  }
  if (existing) {
    await safeClose(existing.context);
    sessions.delete(k);
  }
  const context = await launchBrowser(`${tenantId}-${sessionId}`);
  sessions.set(k, { tenantId, sessionId, context, lastUsedAt: Date.now() });
  metrics.sessions += 1;
  return context;
}

export async function closeSessionContext(tenantId: string, sessionId: string): Promise<void> {
  const k = key(tenantId, sessionId);
  const existing = sessions.get(k);
  if (!existing) return;
  await safeClose(existing.context);
  sessions.delete(k);
}

export function listActiveSessions() {
  return [...sessions.values()].map((s) => ({
    tenant_id: s.tenantId,
    session_id: s.sessionId,
    last_used_at: s.lastUsedAt,
  }));
}
