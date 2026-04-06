"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectOperationalFailure = detectOperationalFailure;
exports.recover = recover;
exports.recoverExecution = recoverExecution;
exports.reassignStrategy = reassignStrategy;
const index_1 = require("../diagnostics/index");
const engine_1 = require("../memory/engine");
/** Portfolio / economic stall signals (distinct from exception logging in `resilience/index.js`). */
function detectOperationalFailure(portfolio) {
    const now = Date.now();
    const lastCycle = Number(portfolio.last_cycle_ts) || 0;
    const noActivityHours = lastCycle ? (now - lastCycle) / 3600000 : 999;
    const revenueToday = Number(portfolio.revenue_today_gbp) || 0;
    const lastTick = Number(portfolio.last_organism_tick) || 0;
    const stalled = lastTick > 0 && now - lastTick > 6 * 3600000 && !!portfolio.autonomous_enabled;
    const diag = (0, index_1.getLastDiagnostics)();
    const costSpike = diag?.checks?.some((c) => c.name === "revenue_book" && c.status === "WARNING") || false;
    return {
        noActivityHours,
        noRevenueDays: revenueToday <= 0 && noActivityHours > 48 ? 2 : 0,
        stalled,
        costSpike,
    };
}
async function recover(ctx) {
    if (ctx.stalled) {
        await (0, engine_1.updateMemoryRecord)({ kind: "resilience_recover", action: "reduce_scope", detail: "scheduler_stall" });
        return { action: "reduce_scope", detail: "Reduced scope after scheduler stall signal." };
    }
    if ((ctx.noActivityHours ?? 0) > 72) {
        await (0, engine_1.updateMemoryRecord)({ kind: "resilience_recover", action: "pivot_template", detail: "inactivity" });
        return { action: "pivot_template", detail: "Pivot template after prolonged inactivity." };
    }
    if (ctx.costSpike) {
        await (0, engine_1.updateMemoryRecord)({ kind: "resilience_recover", action: "reassign_channel", detail: "cost_signal" });
        return { action: "reassign_channel", detail: "Reassign channel after economic warning." };
    }
    return { action: "terminate", detail: "No aggressive recovery required." };
}
async function recoverExecution(fn, opts) {
    const label = opts.label || "execution";
    try {
        const result = await fn();
        return { ok: true, result };
    }
    catch (e) {
        const msg = String(e.message || e);
        await (0, engine_1.updateMemoryRecord)({ kind: "failure", error: msg.slice(0, 400), context: { label } });
        if (opts.fallback) {
            try {
                const result = await opts.fallback();
                await (0, engine_1.updateMemoryRecord)({ kind: "resilience_recover", via: "fallback", label });
                return { ok: true, result, recovered: true };
            }
            catch (e2) {
                return { ok: false, error: String(e2.message || e2) };
            }
        }
        return { ok: false, error: msg };
    }
}
function reassignStrategy(reason) {
    return {
        deploy_limit: 1,
        seedText: `recovery scan — ${String(reason).slice(0, 80)}`,
    };
}
