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
exports.detectRealSignals = detectRealSignals;
exports.mergeSignalsByTopic = mergeSignalsByTopic;
exports.validateSignals = validateSignals;
exports.scoreSignals = scoreSignals;
exports.selectTop = selectTop;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const module_1 = require("module");
const repoPaths_1 = require("../repoPaths");
const market_1 = require("./market");
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
async function fetchJson(url, timeoutMs) {
    try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), timeoutMs);
        const r = await fetch(url, { signal: ac.signal });
        clearTimeout(t);
        if (!r.ok)
            return null;
        return await r.json();
    }
    catch {
        return null;
    }
}
/**
 * Aggregate observable signals only. No fabricated demand: external slots are empty when unconfigured.
 */
async function detectRealSignals(seedText) {
    const root = (0, repoPaths_1.getRepoRoot)();
    const region = (0, market_1.detectMarketRegion)();
    const out = [];
    const now = Date.now();
    try {
        const { detectOpportunities } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "opportunityEngine.js"));
        const { loadState } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "stateStore.js"));
        const state = loadState();
        const opps = await detectOpportunities({
            seedText,
            learning_keywords: state.learning_keywords || {},
        });
        for (const o of opps) {
            const idea = String(o.idea || "");
            const topic = normTopic(idea) || "general";
            let score = Number(o.score) || 0;
            score = (0, market_1.applyRegionalScoreWeight)(score, region);
            out.push({
                id: `int_${topic.slice(0, 24)}_${now}`,
                topic,
                sources: [
                    {
                        name: "internal_pipeline",
                        observedAt: now,
                        rawConfidence: Math.min(0.95, 0.45 + score / 200),
                    },
                ],
                confidence: Math.min(0.92, 0.4 + score / 180),
                payload: { ...o, region },
            });
        }
    }
    catch {
        /* fail safe: no internal signals */
    }
    try {
        const { loadState } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "stateStore.js"));
        const s = loadState();
        const feed = Array.isArray(s.feed) ? s.feed : [];
        for (const row of feed.slice(0, 15)) {
            const text = String(row.text || "").slice(0, 200);
            if (!text)
                continue;
            const topic = normTopic(text);
            out.push({
                id: `feed_${row.ts || now}_${topic.slice(0, 12)}`,
                topic: topic || "operational",
                sources: [
                    {
                        name: "operational_memory",
                        observedAt: Number(row.ts) || now,
                        rawConfidence: 0.55,
                    },
                ],
                confidence: 0.52,
                payload: { feed_line: text, meta: row.meta },
            });
        }
    }
    catch {
        /* ignore */
    }
    const benchPath = process.env.AETHRA_PRICING_BENCHMARKS_JSON;
    if (benchPath && fs.existsSync(benchPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(benchPath, "utf8"));
            const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
            for (const row of rows.slice(0, 8)) {
                const label = String(row.label || row.topic || "benchmark");
                out.push({
                    id: `bench_${normTopic(label).slice(0, 20)}`,
                    topic: normTopic(label),
                    sources: [
                        {
                            name: "pricing_benchmarks",
                            observedAt: now,
                            rawConfidence: 0.5,
                        },
                    ],
                    confidence: 0.48,
                    payload: { benchmark: row },
                });
            }
        }
        catch {
            /* ignore malformed file */
        }
    }
    const marketFile = process.env.AETHRA_MARKETPLACE_SIGNALS_JSON;
    if (marketFile && fs.existsSync(marketFile)) {
        try {
            const raw = JSON.parse(fs.readFileSync(marketFile, "utf8"));
            const rows = Array.isArray(raw) ? raw : [];
            for (const row of rows.slice(0, 12)) {
                const t = normTopic(String(row.query || row.title || row.topic || ""));
                out.push({
                    id: `mkt_${t.slice(0, 16)}`,
                    topic: t,
                    sources: [
                        {
                            name: String(row.source || "marketplace_user_file"),
                            observedAt: Number(row.ts) || now,
                            rawConfidence: Math.min(0.9, Number(row.confidence) || 0.55),
                        },
                    ],
                    confidence: Math.min(0.88, Number(row.confidence) || 0.52),
                    payload: row,
                });
            }
        }
        catch {
            /* ignore */
        }
    }
    const trendsUrl = process.env.AETHRA_TRENDS_PROXY_URL;
    if (trendsUrl) {
        const data = await fetchJson(trendsUrl, 8000);
        if (data && typeof data === "object") {
            out.push({
                id: `trends_${now}`,
                topic: "trend_velocity",
                sources: [{ name: "trends_proxy", observedAt: now, rawConfidence: 0.5 }],
                confidence: 0.5,
                payload: data,
            });
        }
    }
    if (process.env.SERPAPI_KEY) {
        const q = seedText || "commercial intent services UK";
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q.slice(0, 80))}&api_key=${process.env.SERPAPI_KEY}`;
        const data = await fetchJson(url, 10000);
        if (data && typeof data === "object") {
            const organic = Array.isArray(data.organic_results)
                ? data.organic_results
                : [];
            out.push({
                id: `serp_${now}`,
                topic: normTopic(q),
                sources: [{ name: "serp_local_intent", observedAt: now, rawConfidence: 0.48 }],
                confidence: organic.length ? 0.55 : 0.42,
                payload: { organic_count: organic.length, query: q },
            });
        }
    }
    return out;
}
/**
 * Keep signals that have ≥2 distinct source families OR one internal_pipeline with confidence ≥0.72.
 */
function mergeSignalsByTopic(signals) {
    const map = new Map();
    for (const s of signals) {
        const k = s.topic || "general";
        const ex = map.get(k);
        if (!ex) {
            map.set(k, { ...s, sources: [...s.sources], payload: { ...s.payload } });
        }
        else {
            ex.sources.push(...s.sources);
            ex.confidence = Math.max(ex.confidence, s.confidence);
            Object.assign(ex.payload, s.payload);
        }
    }
    return [...map.values()];
}
function validateSignals(signals) {
    const families = (s) => new Set(s.sources.map((x) => x.name.split("_")[0] || x.name));
    const passed = [];
    for (const s of signals) {
        const distinct = families(s).size;
        const hasInternal = s.sources.some((x) => x.name === "internal_pipeline");
        const highInternal = hasInternal && s.confidence >= 0.72;
        const multi = distinct >= 2 || s.sources.length >= 2;
        if (highInternal || multi) {
            passed.push(s);
            continue;
        }
        if (hasInternal && s.confidence >= 0.55 && s.sources.some((x) => x.name === "operational_memory")) {
            passed.push(s);
        }
    }
    return passed;
}
function scoreSignals(signals) {
    return [...signals].sort((a, b) => b.confidence - a.confidence);
}
function selectTop(scored) {
    return scored[0] || null;
}
