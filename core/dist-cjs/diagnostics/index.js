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
exports.getLastDiagnostics = getLastDiagnostics;
exports.runDiagnostics = runDiagnostics;
exports.getSystemState = getSystemState;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const repoPaths_1 = require("../repoPaths");
let _last = null;
function getLastDiagnostics() {
    return _last;
}
function fileOk(p) {
    try {
        fs.accessSync(p, fs.constants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
async function runDiagnostics() {
    const root = (0, repoPaths_1.getRepoRoot)();
    const checks = [];
    const dataSources = {
        portfolio_state: fileOk(path.join(root, "aethra_node", "portfolioExecution", "portfolio_execution_state.json")),
        organism_memory: fileOk(path.join(root, "core", "memory", "organism_memory.json")),
        learning_performance: fileOk(path.join(root, "aethra_node", "memory", "learning_performance.json")),
        serpapi: !!process.env.SERPAPI_KEY,
        marketplace_signals_file: !!process.env.AETHRA_MARKETPLACE_SIGNALS_JSON,
        trends_proxy: !!process.env.AETHRA_TRENDS_PROXY_URL,
    };
    let memoryIntegrity = true;
    try {
        const memPath = path.join(root, "core", "memory", "organism_memory.json");
        if (fileOk(memPath)) {
            const j = JSON.parse(fs.readFileSync(memPath, "utf8"));
            if (!Array.isArray(j.historicalLog)) {
                memoryIntegrity = false;
                checks.push({ name: "memory_shape", status: "CRITICAL", detail: "historicalLog not an array" });
            }
        }
    }
    catch (e) {
        memoryIntegrity = false;
        checks.push({
            name: "memory_read",
            status: "WARNING",
            detail: String(e.message || e).slice(0, 200),
        });
    }
    const stuckDeployments = [];
    let revenueMismatch;
    try {
        const statePath = path.join(root, "aethra_node", "portfolioExecution", "portfolio_execution_state.json");
        if (fileOk(statePath)) {
            const s = JSON.parse(fs.readFileSync(statePath, "utf8"));
            const businesses = Array.isArray(s.businesses) ? s.businesses : [];
            const now = Date.now();
            for (const b of businesses) {
                if (b.status === "draft" && b.created_ts && now - Number(b.created_ts) > 48 * 3600000) {
                    stuckDeployments.push(String(b.id || "unknown"));
                }
            }
            if (stuckDeployments.length) {
                checks.push({
                    name: "stuck_deployments",
                    status: "WARNING",
                    detail: `${stuckDeployments.length} draft(s) idle >48h`,
                });
            }
        }
    }
    catch {
        /* ignore */
    }
    try {
        const learnPath = path.join(root, "aethra_node", "memory", "learning_performance.json");
        const memPath = path.join(root, "core", "memory", "organism_memory.json");
        if (fileOk(learnPath) && fileOk(memPath)) {
            const learn = JSON.parse(fs.readFileSync(learnPath, "utf8"));
            const mem = JSON.parse(fs.readFileSync(memPath, "utf8"));
            const paySum = (Array.isArray(learn.payments) ? learn.payments : []).reduce((a, p) => a + (Number(p.amount_gbp) || 0), 0);
            const verified = Number(mem.verifiedRevenueGbp);
            if (Number.isFinite(verified) && paySum > 0 && Math.abs(paySum - verified) > paySum * 0.5 + 50) {
                revenueMismatch = "learning payments sum diverges from verified organism book (audit)";
                checks.push({ name: "revenue_book", status: "WARNING", detail: revenueMismatch });
            }
        }
    }
    catch {
        /* ignore */
    }
    if (!dataSources.portfolio_state) {
        checks.push({
            name: "portfolio_state",
            status: "CRITICAL",
            detail: "portfolio_execution_state.json missing or unreadable",
        });
    }
    const hasExternalSignal = dataSources.serpapi || dataSources.marketplace_signals_file || dataSources.trends_proxy;
    if (!hasExternalSignal) {
        checks.push({
            name: "external_market_data",
            status: "WARNING",
            detail: "No external signal providers configured — operating on internal + operational memory only",
        });
    }
    let health = "OK";
    for (const c of checks) {
        if (c.status === "CRITICAL")
            health = "CRITICAL";
        else if (c.status === "WARNING" && health !== "CRITICAL")
            health = "WARNING";
    }
    if (!memoryIntegrity && health === "OK")
        health = "WARNING";
    const report = {
        health,
        checks,
        memoryIntegrity,
        revenueMismatch,
        stuckDeployments,
        dataSources,
        at: Date.now(),
    };
    _last = report;
    return report;
}
async function getSystemState() {
    const diagnostics = await runDiagnostics();
    const root = (0, repoPaths_1.getRepoRoot)();
    let portfolio = {};
    try {
        const p = path.join(root, "aethra_node", "portfolioExecution", "portfolio_execution_state.json");
        if (fileOk(p))
            portfolio = JSON.parse(fs.readFileSync(p, "utf8"));
    }
    catch {
        portfolio = {};
    }
    const portfolioReadable = !!diagnostics.dataSources.portfolio_state;
    const operational = portfolioReadable &&
        (diagnostics.health !== "CRITICAL" || process.env.AETHRA_FORCE_OPERATIONAL === "1");
    return {
        operational,
        health: diagnostics.health,
        portfolio,
        diagnostics: reportToPlain(diagnostics),
    };
}
function reportToPlain(d) {
    return { ...d };
}
