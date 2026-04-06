"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCycle = executeCycle;
const path = __importStar(require("path"));
const module_1 = require("module");
const repoPaths_1 = require("../repoPaths");
const index_1 = require("../diagnostics/index");
const orchestrator_1 = require("../data/orchestrator");
const risk_1 = require("../capital/risk");
const evolution_1 = require("../templates/evolution");
const strict_1 = require("../revenue/strict");
const engine_1 = require("../memory/engine");
const system_1 = require("../evolution/system");
const engine_2 = require("../resilience/engine");
const nodeRequire = (0, module_1.createRequire)(__filename);
function normTopic(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 6)
        .join(" ");
}
async function executeCycle(opts = {}) {
    const logs = [];
    const log = (m) => logs.push(`[${new Date().toISOString()}] ${m}`);
    const trace = { steps: [], startedAt: Date.now() };
    const root = (0, repoPaths_1.getRepoRoot)();
    const userId = String(opts.user_id || opts.userId || "anonymous").slice(0, 120);
    const deployLimit = Math.max(1, Math.min(5, Number(opts.deploy_limit) || 3));
    const startedAt = Date.now();
    try {
        const systemState = await (0, index_1.getSystemState)();
        if (!systemState.operational) {
            log("Halted: system non-operational (health or missing portfolio state)");
            return { ok: false, halted: true, reason: "non_operational", logs, diagnostics: systemState.diagnostics };
        }
        const rawSignals = await (0, orchestrator_1.detectRealSignals)(opts.seedText);
        const merged = (0, orchestrator_1.mergeSignalsByTopic)(rawSignals);
        const validated = (0, orchestrator_1.validateSignals)(merged);
        if (!validated.length) {
            log("No valid signals after cross-source validation");
            await (0, engine_1.updateMemoryRecord)({ kind: "cycle_audit", phase: "validate", result: "no_valid_signals" });
            return { ok: false, halted: true, reason: "no_valid_signals", logs };
        }
        const scored = (0, orchestrator_1.scoreSignals)(validated);
        const topSignal = (0, orchestrator_1.selectTop)(scored);
        if (!topSignal) {
            log("No viable signal selected");
            return { ok: false, halted: true, reason: "no_viable_opportunity", logs };
        }
        const { detectOpportunities } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "opportunityEngine.js"));
        const { loadState } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "stateStore.js"));
        const { selectTopOpportunities } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "decisionEngine.js"));
        const { runAethraCycle } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "cycle.js"));
        const s0 = loadState();
        const opportunities = await detectOpportunities({
            seedText: opts.seedText,
            learning_keywords: s0.learning_keywords || {},
        });
        const topic = topSignal.topic;
        let match = opportunities.find((o) => normTopic(String(o.idea || "")) === topic);
        if (!match)
            match = opportunities.find((o) => normTopic(String(o.idea || "")).includes(topic.slice(0, 8)));
        if (!match && topSignal.payload && topSignal.payload.idea) {
            match = topSignal.payload;
        }
        if (!match && opportunities.length)
            match = opportunities[0];
        if (!match) {
            log("No matching internal opportunity for validated signals");
            return { ok: false, halted: true, reason: "no_internal_opportunity", logs };
        }
        const selectedList = selectTopOpportunities(opportunities, deployLimit);
        const primary = selectedList[0] || match;
        const template = (0, evolution_1.selectTemplateForOpportunity)(primary);
        const ranked = (0, evolution_1.rankTemplates)();
        const topTemplateId = ranked[0]?.id;
        const capitalCheck = (0, risk_1.assessCapitalRisk)({ payload: primary }, template, systemState.portfolio);
        trace.steps.push({ name: "assessCapitalRisk", capitalCheck });
        if (!capitalCheck.approved) {
            log(`Capital rejected: ${capitalCheck.reason}`);
            await (0, engine_1.updateMemoryRecord)({
                kind: "capital_reject",
                reason: capitalCheck.reason,
                template_id: template.id,
            });
            return { ok: false, halted: true, reason: capitalCheck.reason, logs, capital: capitalCheck };
        }
        const deployOpts = {
            seedText: opts.seedText || primary.idea,
            baseUrl: opts.baseUrl,
            user_id: userId,
            autonomous_enabled: opts.autonomous_enabled !== undefined
                ? !!opts.autonomous_enabled
                : opts.mode === "assisted"
                    ? false
                    : undefined,
            skip_access_check: opts.skip_access_check,
            deploy_limit: deployLimit,
            campaign_id: opts.campaign_id,
            test_group: opts.test_group,
            template_id: template.id,
            template_meta: {
                name: template.name,
                executionSteps: template.executionSteps,
                cost_structure: template.cost_structure,
                time_to_revenue_days: template.time_to_revenue_days,
                risk_profile: template.risk_profile,
                scalability_score: template.scalability_score,
                monetisation_hooks: template.monetisation_hooks,
                rank: ranked.find((r) => r.id === template.id),
            },
            precalculated_opportunities: opportunities,
            precalculated_selected: selectedList,
        };
        const runDeploy = () => runAethraCycle(deployOpts);
        const alt = (0, engine_2.reassignStrategy)("deploy_retry");
        const fallback = () => runAethraCycle({
            ...deployOpts,
            seedText: alt.seedText,
            deploy_limit: Math.min(deployLimit, alt.deploy_limit),
            precalculated_opportunities: undefined,
            precalculated_selected: undefined,
        });
        const recovered = await (0, engine_2.recoverExecution)(runDeploy, { label: "deployExecution", fallback });
        if (!recovered.ok) {
            log(`Deploy failed: ${recovered.error}`);
            await (0, engine_1.updateMemoryRecord)({
                kind: "deployment",
                ok: false,
                template_id: template.id,
                error: recovered.error,
            });
            return { ok: false, halted: true, reason: recovered.error, logs, trace };
        }
        const cycleResult = recovered.result;
        trace.steps.push({
            name: "deployExecution",
            ok: cycleResult?.ok !== false,
            recovered: recovered.recovered,
        });
        const deployments = cycleResult?.deployments || [];
        const performanceRows = deployments.map((d) => {
            const x = d;
            return { id: x.business?.id, signal: x.performance?.signal_strength };
        });
        trace.steps.push({ name: "track", rows: performanceRows });
        const revenue = await (0, strict_1.captureRevenue)(startedAt);
        trace.steps.push({ name: "captureRevenue", revenue });
        const { bumpTemplateUsage, recordConversionRate, setActiveSystemsCount, } = nodeRequire(path.join(root, "core", "memory", "store.js"));
        const evolution = nodeRequire(path.join(root, "core", "evolution", "engine.js"));
        bumpTemplateUsage(template.id);
        for (const d of deployments) {
            const row = d;
            const perf = row.performance;
            if (perf)
                recordConversionRate(Number(perf.conversion_rate) || 0);
            const outcome = row.capital?.action === "kill"
                ? "kill"
                : row.capital?.action === "scale"
                    ? "scale"
                    : String(perf?.signal_strength || "moderate");
            await (0, engine_1.updateMemoryRecord)({
                kind: "deployment",
                ok: true,
                template_id: template.id,
                business_id: row.business?.id,
                outcome,
            });
            evolution.learnFromOutcome({
                template_id: template.id,
                revenue_proxy: 0,
                killed: row.capital?.action === "kill",
                scaled: row.capital?.action === "scale",
            });
        }
        const s1 = loadState();
        setActiveSystemsCount(s1.businesses.filter((b) => b.status === "live").length);
        const insights = (0, engine_1.deriveInsights)();
        await (0, engine_1.updateMemoryRecord)({
            kind: "memory_insights",
            insights,
            cycle_ts: Date.now(),
        });
        await (0, system_1.evolveSystem)();
        const failCtx = (0, engine_2.detectOperationalFailure)(s1);
        const recovery = await (0, engine_2.recover)(failCtx);
        await (0, engine_1.updateMemoryRecord)({ kind: "failure_context", failCtx, recovery });
        const diagnostics = await (0, index_1.runDiagnostics)();
        const finishedAt = Date.now();
        trace.finishedAt = finishedAt;
        trace.elapsedMs = finishedAt - startedAt;
        await (0, engine_1.updateMemoryRecord)({
            kind: "cycle_complete",
            ok: true,
            top_template_id: topTemplateId,
            revenue: { ...revenue },
            recovery,
        });
        log(`Cycle complete; health=${diagnostics.health}`);
        const { calculateDailyRevenue, calculateWinRate, projectGrowth } = nodeRequire(path.join(root, "core", "profit", "engine.js"));
        return {
            ok: true,
            logs,
            trace,
            cycle: cycleResult,
            capital: capitalCheck,
            revenue: { ...revenue },
            diagnostics: diagnostics,
            topTemplateId,
            profit: {
                daily: calculateDailyRevenue(s1),
                winRate: calculateWinRate(s1),
                growth: projectGrowth({
                    last_cycle_ts: s1.last_cycle_ts,
                    portfolio_cycles: s1.usage?.portfolio_cycles,
                }),
            },
        };
    }
    catch (e) {
        const msg = String(e.message || e);
        log(`Unhandled: ${msg}`);
        await (0, engine_1.updateMemoryRecord)({ kind: "failure", error: msg.slice(0, 500), phase: "executeCycle" });
        await (0, index_1.runDiagnostics)();
        return { ok: false, halted: true, reason: msg, logs, trace };
    }
}
