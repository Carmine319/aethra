/**
 * AETHRA v7 — Capital Auto-Allocation + Profit Reinvestment (additive plugin).
 * Does not alter prior Ω layers; call from orchestrators as needed.
 */

export { updateTreasury, getTreasury, applyTreasuryMove } from "./engine/treasury.manager";
export { calculateReinvestment } from "./engine/reinvestment.engine";
export { allocateCapital } from "./engine/allocation.engine";

export { registerVenture, getVentures, type VentureRecord } from "./portfolio/portfolio.registry";
export { scoreVenture } from "./portfolio/venture.score";
export { distributeCapital } from "./portfolio/capital.distribution";

export { assessRisk, type RiskLevel } from "./risk/risk.engine";
export { enforceExposureLimit } from "./risk/exposure.control";

export {
  recordProfit,
  getTotalProfit,
  getProfitHistory,
  appendCashflowLog,
} from "./accounting/profit.tracker";
export { runV6ToV7Cycle } from "./examples/v7.demo";
