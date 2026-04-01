/**
 * AETHRA v10 — External Market Interface (additive plugin surface).
 * Does not alter Ω v1–v9 modules.
 */

export { orchestrateChannels } from "./channels/channel.orchestrator";
export * from "./channels/social.channels";
export * from "./channels/marketplace.channels";
export * from "./channels/outbound.channels";

export { bindToEntity } from "./connectors/identity.connector";
export { createPaymentIntentStub } from "./connectors/stripe.connector";
export { queueOutboundEmail } from "./connectors/email.connector";
export { syncCrmRecord } from "./connectors/crm.connector";

export { ingestLead } from "./acquisition/lead.engine";
export { recordTraffic } from "./acquisition/traffic.engine";
export { defineAudience } from "./acquisition/audience.builder";
export { optimiseAcquisition } from "./acquisition/acquisition.optimizer";

export { publishLandingVariant } from "./conversion/landing.engine";
export { deliverOffer } from "./conversion/offer.delivery";
export { startCheckoutFlow } from "./conversion/checkout.flow";
export { optimiseConversion } from "./conversion/conversion.optimizer";

export { markFulfilled } from "./operations/fulfilment.engine";
export { upsertCustomer } from "./operations/customer.engine";
export { logTicket } from "./operations/support.system";
export { retainCustomer } from "./operations/retention.engine";

export { logExternalEvent } from "./compliance/audit.bridge";
export { resolveLegalEntity, mapActionToIdentity } from "./compliance/identity.mapping";
export { assertExternalPolicies } from "./compliance/policy.enforcer";
export { generateEvidence } from "./compliance/evidence.generator";

export { ingestMarketSignal } from "./feedback/signal.ingestion";
export { recordMarketResponse } from "./feedback/market.response";
export { normaliseFeedback } from "./feedback/feedback.normaliser";

export { appendCashflow } from "./revenue/real.cashflow";
export { schedulePayout } from "./revenue/payout.engine";
export { attributeRevenue } from "./revenue/revenue.attribution";
