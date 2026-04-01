/**
 * AETHRA v13 — Recursive architecture evolution (additive; coexists with legacy evolution/*.ts/js).
 */

export { readEvolutionPolicy, assertEvolutionAllowed } from "./governance/evolution.policy";
export { evolutionKill } from "./governance/kill.switch.evolution";
export { assessBlastRadius } from "./governance/blast.radius";
export { enforceInvariants } from "./governance/invariants.guard";

export type { EvolutionProposal, ExpectedImpact } from "./proposals/proposal.schema";
export { buildProposal } from "./proposals/proposal.builder";
export { prioritiseProposals } from "./proposals/proposal.prioritiser";
export { enqueueProposal, readProposalQueue } from "./proposals/proposal.queue";

export { buildDependencyGraph } from "./diff/dependency.graph";
export { generateDiff } from "./diff/diff.generator";
export { recordPatchIntent } from "./diff/patch.applier";
export { analyseImpact } from "./diff/impact.analyser";

export { simulateWorlds } from "./sandbox/simulation.grid";
export { runScenarioTests } from "./sandbox/scenario.tests";
export { runRegressionCheck } from "./sandbox/regression.tests";
export { runSandbox } from "./sandbox/sandbox.runner";

export { validateEconomics } from "./validation/economic.validator";
export { validateAgainstPolicy } from "./validation/policy.validator";
export { assessRisk } from "./validation/risk.assessor";
export { assertApproved } from "./validation/approval.gateway";

export { phasedDeploy } from "./deployment/phased.deployment";
export { canaryExposure } from "./deployment/canary.engine";
export { planRollout } from "./deployment/rollout.engine";
export { recordRollbackIntent } from "./deployment/rollback.engine";

export { registerVersion } from "./versioning/version.registry";
export { appendLineage, traceLineage, type LineageNode } from "./versioning/lineage.graph";
export { saveSnapshot } from "./versioning/snapshot.manager";
export { logArchitecture, getArchitectureHistory } from "./versioning/architecture.history";

export { measureEvolutionVelocity, improvementRate } from "./telemetry/evolution.velocity";
export { summariseChanges } from "./telemetry/change.metrics";
export { attributeEvolutionOutcome } from "./telemetry/attribution.engine";

export { runEvolutionCycle } from "./v13.pipeline";
