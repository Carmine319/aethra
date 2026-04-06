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
exports.computeTemplateStats = computeTemplateStats;
exports.rankTemplates = rankTemplates;
exports.cloneTemplate = cloneTemplate;
exports.selectTemplateForOpportunity = selectTemplateForOpportunity;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const module_1 = require("module");
const repoPaths_1 = require("../repoPaths");
const nodeRequire = (0, module_1.createRequire)(__filename);
const CLONES_FILE = path.join((0, repoPaths_1.getRepoRoot)(), "core", "templates", "template_clones.json");
function performancePath() {
    return path.join((0, repoPaths_1.getRepoRoot)(), "core", "templates", "template_performance.json");
}
function loadPerf() {
    try {
        const j = JSON.parse(fs.readFileSync(performancePath(), "utf8"));
        return j && typeof j === "object" ? j : {};
    }
    catch {
        return {};
    }
}
function loadHistoryTemplateCounts() {
    const failures = {};
    const wins = {};
    const times = {};
    try {
        const memPath = path.join((0, repoPaths_1.getRepoRoot)(), "core", "memory", "organism_memory.json");
        const j = JSON.parse(fs.readFileSync(memPath, "utf8"));
        const log = Array.isArray(j.historicalLog) ? j.historicalLog : [];
        for (const row of log) {
            const tid = String(row.template_id || "");
            if (!tid)
                continue;
            if (row.kind === "deployment") {
                if (row.outcome === "kill")
                    failures[tid] = (failures[tid] || 0) + 1;
                if (row.outcome === "strong" || row.outcome === "scale")
                    wins[tid] = (wins[tid] || 0) + 1;
                if (typeof row.revenue_proxy === "number") {
                    times[tid] = times[tid] || [];
                    times[tid].push(row.revenue_proxy);
                }
            }
        }
    }
    catch {
        /* ignore */
    }
    return { failures, wins, times };
}
function computeTemplateStats(templateId, baseTimeToRevenue) {
    const perf = loadPerf()[templateId] || { score: 0, n: 0 };
    const { failures, wins, times } = loadHistoryTemplateCounts();
    const w = wins[templateId] || 0;
    const f = failures[templateId] || 0;
    const denom = w + f || 1;
    const successRate = w / denom;
    const arr = times[templateId] || [];
    const pScore = Number(perf.score) || 0;
    const pN = Number(perf.n) || 0;
    const avgROI = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : pN ? pScore / pN : 0;
    const failureModes = {};
    if (f)
        failureModes.kill = f;
    const perfBoost = pN ? Math.max(-2, Math.min(3, pScore / Math.max(1, pN))) : 0;
    const adaptabilityScore = Math.round(Math.min(100, 40 + successRate * 45 + perfBoost * 8));
    const decay = successRate < 0.25 && (w + f) >= 4 ? 0.15 : successRate > 0.55 ? 0 : 0.05;
    return {
        id: templateId,
        successRate: Math.round(successRate * 1000) / 1000,
        avgTimeToRevenue: baseTimeToRevenue,
        avgROI: Math.round(avgROI * 1000) / 1000,
        failureModes,
        adaptabilityScore,
        decay,
    };
}
function rankTemplates() {
    const root = (0, repoPaths_1.getRepoRoot)();
    const { TEMPLATES } = nodeRequire(path.join(root, "core", "templates", "registry.js"));
    const list = TEMPLATES;
    const ranked = list.map((t) => {
        const stats = computeTemplateStats(t.id, Number(t.time_to_revenue_days) || 21);
        const rankScore = stats.successRate * 3.2 +
            stats.adaptabilityScore / 35 -
            stats.decay * 4 -
            stats.avgTimeToRevenue / 80 +
            stats.avgROI * 0.8;
        return { id: t.id, rankScore: Math.round(rankScore * 1000) / 1000, stats, def: t };
    });
    ranked.sort((a, b) => b.rankScore - a.rankScore);
    return ranked;
}
function cloneTemplate(templateId, variation) {
    const root = (0, repoPaths_1.getRepoRoot)();
    const { TEMPLATES } = nodeRequire(path.join(root, "core", "templates", "registry.js"));
    const base = TEMPLATES.find((t) => t.id === templateId);
    if (!base)
        return { ok: false, error: "template_not_found" };
    const cloneId = `${templateId}_clone_${variation}_${Date.now().toString(36)}`;
    const clone = {
        ...base,
        id: cloneId,
        parent_id: templateId,
        variation,
        name: `${base.name || templateId} (${variation})`,
        ...(variation === "pricing"
            ? {
                cost_structure: {
                    ...base.cost_structure,
                    fixed_gbp: Math.round((base.cost_structure?.fixed_gbp || 150) * 1.08 * 100) / 100,
                },
            }
            : {}),
        ...(variation === "channel"
            ? { monetisation_hooks: [...(base.monetisation_hooks || []), "alternate_channel_test"] }
            : {}),
        ...(variation === "positioning"
            ? {
                executionSteps: [
                    ...(base.executionSteps || []).slice(0, -1),
                    "positioning_ab_test",
                ],
            }
            : {}),
    };
    let clones = [];
    try {
        if (fs.existsSync(CLONES_FILE))
            clones = JSON.parse(fs.readFileSync(CLONES_FILE, "utf8"));
        if (!Array.isArray(clones))
            clones = [];
    }
    catch {
        clones = [];
    }
    clones.push({ created_at: Date.now(), clone });
    try {
        fs.mkdirSync(path.dirname(CLONES_FILE), { recursive: true });
        fs.writeFileSync(CLONES_FILE, JSON.stringify(clones, null, 2), "utf8");
    }
    catch (e) {
        return { ok: false, error: String(e.message || e) };
    }
    return { ok: true, clone };
}
function selectTemplateForOpportunity(opportunityPayload) {
    const ranked = rankTemplates();
    if (!ranked.length) {
        return { id: "local_service_fast", name: "fallback" };
    }
    const idea = String(opportunityPayload.idea || opportunityPayload.text || "").toLowerCase();
    let pick = ranked[0]?.def;
    if (idea.includes("b2b") || idea.includes("saas")) {
        const b2b = ranked.find((r) => r.id === "b2b_pilot_strict");
        if (b2b)
            pick = b2b.def;
    }
    if (idea.includes("local")) {
        const loc = ranked.find((r) => r.id === "local_service_fast");
        if (loc)
            pick = loc.def;
    }
    return pick || ranked[0].def;
}
