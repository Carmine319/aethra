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
exports.captureRevenue = captureRevenue;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const module_1 = require("module");
const repoPaths_1 = require("../repoPaths");
const nodeRequire = (0, module_1.createRequire)(__filename);
/**
 * Confirmed settlement paths only (Stripe learning ledger + optional manual verified flag).
 */
async function captureRevenue(sinceTs) {
    const root = (0, repoPaths_1.getRepoRoot)();
    let verifiedGbp = 0;
    let flaggedGbp = 0;
    const sources = [];
    try {
        const { LEARNING_FILE } = nodeRequire(path.join(root, "aethra_node", "memory", "learningEngine.js"));
        const learn = JSON.parse(fs.readFileSync(LEARNING_FILE, "utf8"));
        const payments = Array.isArray(learn.payments) ? learn.payments : [];
        for (const p of payments) {
            const ts = Number(p.ts) || 0;
            if (ts < sinceTs)
                continue;
            const src = String(p.source || "");
            const stripeLike = src.startsWith("stripe") || src === "stripe_deal_payment" || src === "stripe_wallet_topup";
            const amt = Number(p.amount_gbp) || 0;
            if (stripeLike && amt > 0) {
                verifiedGbp += amt;
                sources.push(src);
            }
            else if (amt > 0) {
                flaggedGbp += amt;
                sources.push(`${src}_unverified`);
            }
        }
    }
    catch {
        /* no ledger */
    }
    verifiedGbp = Math.round(verifiedGbp * 100) / 100;
    flaggedGbp = Math.round(flaggedGbp * 100) / 100;
    const total = verifiedGbp + flaggedGbp;
    const revenueConfidenceScore = total <= 0 ? 0 : Math.round((verifiedGbp / total) * 1000) / 1000;
    return {
        verifiedGbp,
        flaggedGbp,
        revenueConfidenceScore,
        sources,
        note: flaggedGbp > 0
            ? "Non-Stripe ledger rows present — flagged amounts excluded from verified core metrics."
            : "Verified slice uses Stripe-classified payment events only.",
    };
}
