"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMarketRegion = detectMarketRegion;
exports.demandElasticityProxy = demandElasticityProxy;
exports.pricingSensitivity = pricingSensitivity;
exports.applyRegionalScoreWeight = applyRegionalScoreWeight;
function detectMarketRegion() {
    const r = String(process.env.AETHRA_MARKET_REGION || process.env.VERCEL_REGION || "UK")
        .toUpperCase()
        .slice(0, 8);
    if (r.includes("US") || r === "IAD1" || r === "SFO1")
        return "US";
    if (r.includes("EU") || r.includes("FRA") || r.includes("AMS"))
        return "EU";
    if (r.includes("UK") || r.includes("LHR"))
        return "UK";
    return "OTHER";
}
/**
 * Demand elasticity proxy: higher when competition_intensity is low (bounded, not predictive).
 */
function demandElasticityProxy(signal) {
    const comp = String(signal.payload?.competition_intensity || "").toLowerCase();
    const base = comp === "high" ? 0.35 : comp === "moderate" ? 0.55 : 0.72;
    return Math.min(0.85, Math.max(0.2, base));
}
/**
 * Pricing sensitivity: region-specific cost-of-sale prior (heuristic band).
 */
function pricingSensitivity(region) {
    switch (region) {
        case "US":
            return 0.62;
        case "EU":
            return 0.58;
        case "UK":
            return 0.6;
        default:
            return 0.55;
    }
}
function applyRegionalScoreWeight(score, region) {
    const w = pricingSensitivity(region);
    return Math.round(score * (0.85 + w * 0.25) * 1000) / 1000;
}
