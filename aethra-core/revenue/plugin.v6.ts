/**
 * AETHRA v6 — Autonomous Revenue Loops (additive plugin surface).
 * Does not replace legacy `revenue/engine.*`; register loops here and call `runAllLoops`.
 */

export { registerLoop, getActiveLoops, getAllLoops, type RevenueLoop } from "./loops/loop.registry";
export { executeLoop } from "./loops/loop.engine";
export { runAllLoops } from "./loops/loop.scheduler";

export { buildFunnel, type FunnelDefinition } from "./funnels/funnel.builder";
export { runFunnel } from "./funnels/funnel.executor";
export * from "./funnels/conversion.tracker";

export { collectSignals } from "./signals/signal.collector";
export { scoreSignal } from "./signals/signal.scorer";

export { runAB } from "./optimisation/ab.engine";
export { mutate } from "./optimisation/mutation.engine";
export { shouldKill } from "./optimisation/kill.switch";

export { generateOffer } from "./monetisation/offer.engine";
export { optimisePrice } from "./monetisation/pricing.engine";
export { selectChannel } from "./monetisation/channel.selector";

export { appendPerformanceLog, storeResult, getBestPerformers } from "./memory/revenue.memory";
