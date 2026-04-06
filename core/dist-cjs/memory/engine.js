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
exports.deriveInsights = deriveInsights;
exports.updateMemoryRecord = updateMemoryRecord;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const module_1 = require("module");
const repoPaths_1 = require("../repoPaths");
const nodeRequire = (0, module_1.createRequire)(__filename);
function loadMemory() {
    const p = path.join((0, repoPaths_1.getRepoRoot)(), "core", "memory", "organism_memory.json");
    try {
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        return { historicalLog: Array.isArray(j.historicalLog) ? j.historicalLog : [] };
    }
    catch {
        return { historicalLog: [] };
    }
}
function deriveInsights() {
    const { historicalLog } = loadMemory();
    const recent = historicalLog.slice(-400);
    const templateWins = {};
    const templateFails = {};
    const correlations = {};
    for (const row of recent) {
        if (row.kind !== "deployment")
            continue;
        const tid = String(row.template_id || "");
        if (!tid)
            continue;
        const o = String(row.outcome || "");
        if (o === "strong" || o === "scale")
            templateWins[tid] = (templateWins[tid] || 0) + 1;
        if (o === "kill") {
            templateFails[tid] = (templateFails[tid] || 0) + 1;
            const k = `${tid}:${o}`;
            correlations[k] = (correlations[k] || 0) + 1;
        }
    }
    const winningTemplates = Object.entries(templateWins)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id]) => id);
    const failureCorrelations = Object.entries(correlations).map(([key, count]) => {
        const [template_id, outcome] = key.split(":");
        return { template_id, outcome, count };
    });
    const clusters = winningTemplates.map((id) => `template_cluster:${id}`);
    const deltaNotes = [];
    for (const row of recent.slice(-30)) {
        if (row.kind === "deployment" && row.revenue_proxy != null && Number(row.revenue_proxy) === 0) {
            deltaNotes.push("Zero-yield deployment observed — tighten capital gate or template.");
            break;
        }
    }
    return {
        winningTemplates,
        failureCorrelations,
        clusters,
        deltaExpectationNotes: deltaNotes,
    };
}
async function updateMemoryRecord(entry) {
    const { appendHistorical } = nodeRequire(path.join((0, repoPaths_1.getRepoRoot)(), "core", "memory", "store.js"));
    appendHistorical(entry);
}
