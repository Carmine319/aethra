/**
 * AETHRA v14 — Federated intelligence + external assimilation (additive plugin surface).
 */

export { readFederationPolicy, assertFederationOperational } from "./governance/federation.policy";
export { assertPartnerShare } from "./governance/isolation.guard";
export { openDispute } from "./governance/dispute.engine";
export { blockSystemRisk } from "./governance/systemic.risk.firewall";

export { federationLog, registerPartner, listPartners } from "./memory/partner.registry";
export { recordTopology, type TopologyEdge } from "./memory/network.topology";

export { registerAdapter, listAdapters } from "./connectors/adapter.registry";
export { negotiateProtocol } from "./connectors/protocol.negotiator";
export { handshake } from "./connectors/capability.handshake";
export { gatewayIngress } from "./connectors/protocol.gateway";

export type { FederationContract } from "./contracts/contract.schema";
export { createContract } from "./contracts/contract.engine";
export { assertSla } from "./contracts/sla.manager";
export { adjustContract } from "./contracts/dynamic.contracts";

export { declareIdentity } from "./identity/identity.manager";
export { anchorTrustBundle } from "./identity/trust.anchor";
export { assertAccess } from "./identity/access.control";
export { updateReputation, getReputation } from "./identity/reputation.layer";

export { routeCapability } from "./exchange/capability.routing";
export { exchangeDataPayload } from "./exchange/data.exchange";
export { exchangeModelRef } from "./exchange/model.exchange";
export { routeTask } from "./exchange/task.exchange";

export { meterUsage } from "./economics/metering.engine";
export { priceExchange } from "./economics/pricing.engine";
export { settle } from "./economics/settlement.engine";
export { computeLiquidity } from "./economics/market.liquidity";

export { compressIntelligence } from "./learning/intelligence.compression";
export { distillSignals } from "./learning/knowledge.distillation";
export { integrateExternalObservations } from "./learning/cross.system.learning";
