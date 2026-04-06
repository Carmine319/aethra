import { getLastDiagnostics } from "../diagnostics/index";
import { updateMemoryRecord } from "../memory/engine";

export type RecoverAction = "terminate" | "pivot_template" | "reduce_scope" | "reassign_channel";

export interface FailureContext {
  noActivityHours?: number;
  noRevenueDays?: number;
  stalled?: boolean;
  costSpike?: boolean;
}

/** Portfolio / economic stall signals (distinct from exception logging in `resilience/index.js`). */
export function detectOperationalFailure(portfolio: Record<string, unknown>): FailureContext {
  const now = Date.now();
  const lastCycle = Number(portfolio.last_cycle_ts) || 0;
  const noActivityHours = lastCycle ? (now - lastCycle) / 3600000 : 999;
  const revenueToday = Number(portfolio.revenue_today_gbp) || 0;
  const lastTick = Number(portfolio.last_organism_tick) || 0;
  const stalled = lastTick > 0 && now - lastTick > 6 * 3600000 && !!portfolio.autonomous_enabled;

  const diag = getLastDiagnostics();
  const costSpike = diag?.checks?.some((c) => c.name === "revenue_book" && c.status === "WARNING") || false;

  return {
    noActivityHours,
    noRevenueDays: revenueToday <= 0 && noActivityHours > 48 ? 2 : 0,
    stalled,
    costSpike,
  };
}

export async function recover(ctx: FailureContext): Promise<{ action: RecoverAction; detail: string }> {
  if (ctx.stalled) {
    await updateMemoryRecord({ kind: "resilience_recover", action: "reduce_scope", detail: "scheduler_stall" });
    return { action: "reduce_scope", detail: "Reduced scope after scheduler stall signal." };
  }
  if ((ctx.noActivityHours ?? 0) > 72) {
    await updateMemoryRecord({ kind: "resilience_recover", action: "pivot_template", detail: "inactivity" });
    return { action: "pivot_template", detail: "Pivot template after prolonged inactivity." };
  }
  if (ctx.costSpike) {
    await updateMemoryRecord({ kind: "resilience_recover", action: "reassign_channel", detail: "cost_signal" });
    return { action: "reassign_channel", detail: "Reassign channel after economic warning." };
  }
  return { action: "terminate", detail: "No aggressive recovery required." };
}

export async function recoverExecution<T>(
  fn: () => Promise<T>,
  opts: { label?: string; fallback?: () => Promise<T> }
): Promise<{ ok: true; result: T; recovered?: boolean } | { ok: false; error: string }> {
  const label = opts.label || "execution";
  try {
    const result = await fn();
    return { ok: true, result };
  } catch (e) {
    const msg = String((e as Error).message || e);
    await updateMemoryRecord({ kind: "failure", error: msg.slice(0, 400), context: { label } });
    if (opts.fallback) {
      try {
        const result = await opts.fallback();
        await updateMemoryRecord({ kind: "resilience_recover", via: "fallback", label });
        return { ok: true, result, recovered: true };
      } catch (e2) {
        return { ok: false, error: String((e2 as Error).message || e2) };
      }
    }
    return { ok: false, error: msg };
  }
}

export function reassignStrategy(reason: string): { deploy_limit: number; seedText: string } {
  return {
    deploy_limit: 1,
    seedText: `recovery scan — ${String(reason).slice(0, 80)}`,
  };
}
