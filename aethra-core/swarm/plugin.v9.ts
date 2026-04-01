/**
 * AETHRA v9 — Multi-Agent Swarm Layer (additive plugin surface).
 */

export { createAgent, beginSwarmCycle } from "./agents/agent.factory";
export type { AgentProfile, SwarmRole } from "./agents/agent.profile";
export {
  registerAgent,
  getAgents,
  getActiveAgents,
  updateAgentCapital,
  type SwarmAgent,
} from "./agents/agent.registry";
export { updateLifecycle } from "./agents/agent.lifecycle";
export { logAgentAction } from "./agents/agent.history.append";

export { creatorIntent } from "./roles/creator.agent";
export { sellerQuote } from "./roles/seller.agent";
export { optimiserProposal } from "./roles/optimiser.agent";
export { scoutSignal } from "./roles/scout.agent";
export { arbitrageOpportunity } from "./roles/arbitrage.agent";
export { allocatorDistribute } from "./roles/allocator.agent";

export { runMarketTick } from "./market/market.engine";
export { submitBid } from "./market/bidding.system";
export { discoverClearingPrice } from "./market/pricing.discovery";
export { injectLiquidity } from "./market/liquidity.engine";

export { publishTask, claimTask } from "./coordination/task.exchange";
export { signContract } from "./coordination/contract.engine";
export { adjustReputation } from "./coordination/reputation.system";
export { negotiate } from "./coordination/negotiation.engine";

export { runTournament } from "./competition/tournament.engine";
export { rankAgents } from "./competition/performance.ranker";
export { eliminateWeakAgents } from "./competition/elimination.engine";

export { formCoalition } from "./collaboration/coalition.engine";
export { splitRevenue } from "./collaboration/revenue.splitter";
export { storeAlliance, readAlliances } from "./collaboration/alliance.memory";

export { assertSwarmOperational, globalKill } from "./governance/system.stability";
export { assertAgentEconomicallyJustified, assertMeasurableUtility } from "./governance/agent.constraints";
export { assessSystemRisk } from "./governance/systemic.risk.engine";

export { appendSwarmMemory, readSwarmMemory } from "./memory/swarm.memory";
export { deriveMacroTrends } from "./memory/macro.intelligence";
