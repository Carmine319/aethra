/**
 * AETHRA v12 — Anti-fragility + shock amplification (additive plugin surface).
 */

export { readAntifragilityPolicy, assertAntifragilityOperational } from "./governance/stress.policy";
export { guardSubsystemHandoff } from "./governance/system.guard";
export { preventCascade } from "./governance/cascade.prevention";

export { scaleShockIntensity } from "./shock/shock.intensity.scaler";
export { classifyShock, type ShockClass } from "./shock/shock.classifier";
export { registerShock } from "./shock/shock.registry";
export { detectShock } from "./shock/shock.detector";

export { resolveWithFallback } from "./resilience/fallback.engine";
export { ensureRedundantPaths } from "./resilience/redundancy.manager";
export { recordFailure, resetCircuit, assertCircuitClosed } from "./resilience/circuit.breaker";
export { recoverSystem } from "./resilience/recovery.engine";

export { extractVolatility } from "./amplification/volatility.extractor";
export { mapDislocationToOpportunity } from "./amplification/opportunity.mapper";
export { boundedLeverage } from "./amplification/leverage.engine";
export { findAsymmetry } from "./amplification/asymmetry.engine";

export { rebalanceUnderStress } from "./capital/dynamic.rebalancer";
export { floorExposure } from "./capital/downside.protection";
export { applyConvexity } from "./capital/convexity.engine";

export { analyseFailure } from "./learning/failure.analyser";
export { adaptFromFailure } from "./learning/adaptation.engine";
export { storePattern, getPatterns } from "./learning/pattern.memory";

export { runAntifragilityCycle } from "./pipeline";
