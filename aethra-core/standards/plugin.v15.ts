/**
 * AETHRA v15 — Protocol emergence + ecosystem standardisation (additive plugin surface).
 */

export { analyseEntropy } from "./discovery/entropy.analyser";
export { extractPatterns } from "./discovery/pattern.extractor";
export { analyseInteractions } from "./discovery/interaction.analysis";
export { detectRepetition } from "./discovery/repetition.detector";
export { inferLatentPatterns } from "./discovery/latent.pattern.engine";

export { defineProtocolSchema, type ProtocolSchema } from "./design/protocol.schema";
export { buildProtocol } from "./design/protocol.builder";
export { assessCompatibility } from "./design/compatibility.engine";
export { planEvolution } from "./design/evolution.strategy";
export { enforceDeterminism } from "./design/determinism.engine";

export { registerProtocol, getProtocol, listProtocols } from "./registry/protocol.registry";
export { compareVersions, selectLatest } from "./registry/version.manager";
export { recordAdoption, adoptionSummary } from "./registry/adoption.tracker";
export { transitionLifecycle, type Lifecycle } from "./registry/protocol.lifecycle";
export { mapDependencies } from "./registry/dependency.lockin.map";

export { generateSdkStub } from "./distribution/sdk.generator";
export { declareApiSurface } from "./distribution/api.surface";
export { renderDocumentation } from "./distribution/documentation.engine";
export { autopilotIntegrate } from "./distribution/integration.autopilot";
export { loadProtocol } from "./distribution/zero.friction.loader";

export { computeIncentiveSignal } from "./economics/incentive.engine";
export { suggestUnitPrice } from "./economics/pricing.model";
export { estimateNetworkValue } from "./economics/network.effects";
export { simulateFlywheelPulse } from "./economics/adoption.flywheel";
export { computeSwitchingCost } from "./economics/switching.cost.engine";

export { assertAdditiveOnly } from "./governance/standard.policy";
export { approveUpgrade, type UpgradeTicket } from "./governance/upgrade.policy";
export { guardFork } from "./governance/fork.guard";
export { PROTOCOL_CONSTITUTION } from "./governance/protocol.constitution";
export { enforceInvariance } from "./governance/invariance.enforcer";

export { enablePartner } from "./ecosystem/partner.enablement";
export { listTemplates, getTemplate } from "./ecosystem/integration.templates";
export { buildEcosystemMap } from "./ecosystem/ecosystem.map";
export { assignRoles, type SpecialisedRole } from "./ecosystem/role.specialisation";
export { buildGraph } from "./ecosystem/dependency.graph";

export { runStandardisationLoop } from "./loop";
