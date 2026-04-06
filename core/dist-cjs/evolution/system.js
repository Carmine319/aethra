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
exports.getAdaptiveState = getAdaptiveState;
exports.evolveSystem = evolveSystem;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const repoPaths_1 = require("../repoPaths");
const engine_1 = require("../memory/engine");
const evolution_1 = require("../templates/evolution");
const ADAPTIVE_FILE = path.join((0, repoPaths_1.getRepoRoot)(), "core", "evolution", "adaptive_weights.json");
function loadAdaptive() {
    try {
        const j = JSON.parse(fs.readFileSync(ADAPTIVE_FILE, "utf8"));
        return {
            signalWeightInternal: Number(j.signalWeightInternal) || 1,
            signalWeightExternal: Number(j.signalWeightExternal) || 1,
            templateBias: j.templateBias && typeof j.templateBias === "object" ? j.templateBias : {},
            capitalDeployFrac: Number(j.capitalDeployFrac) || 0.12,
            updatedAt: Number(j.updatedAt) || 0,
        };
    }
    catch {
        return {
            signalWeightInternal: 1,
            signalWeightExternal: 1,
            templateBias: {},
            capitalDeployFrac: 0.12,
            updatedAt: 0,
        };
    }
}
function getAdaptiveState() {
    return loadAdaptive();
}
/**
 * Tighten waste, bias toward faster cash templates, nudge capital frac down on friction.
 */
async function evolveSystem() {
    const prev = loadAdaptive();
    const insights = (0, engine_1.deriveInsights)();
    const ranked = (0, evolution_1.rankTemplates)();
    const next = { ...prev, templateBias: { ...prev.templateBias }, updatedAt: Date.now() };
    if (insights.failureCorrelations.length >= 3) {
        next.capitalDeployFrac = Math.max(0.06, prev.capitalDeployFrac * 0.92);
        next.signalWeightExternal = Math.min(1.4, prev.signalWeightExternal * 1.05);
    }
    if (insights.winningTemplates.length) {
        next.signalWeightInternal = Math.min(1.25, prev.signalWeightInternal * 1.02);
        for (const id of insights.winningTemplates) {
            next.templateBias[id] = Math.min(0.35, (next.templateBias[id] || 0) + 0.04);
        }
    }
    for (let i = 0; i < ranked.length; i++) {
        const id = ranked[i].id;
        if (i > ranked.length - 2 && ranked[i].stats.decay > 0.1) {
            next.templateBias[id] = Math.max(-0.25, (next.templateBias[id] || 0) - 0.06);
        }
    }
    try {
        fs.mkdirSync(path.dirname(ADAPTIVE_FILE), { recursive: true });
        fs.writeFileSync(ADAPTIVE_FILE, JSON.stringify(next, null, 2), "utf8");
    }
    catch {
        /* ignore */
    }
    return next;
}
