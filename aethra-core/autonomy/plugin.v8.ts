/**
 * AETHRA v8 — Sovereign Autonomy Layer (additive plugin surface).
 */

export { runAutonomyCycle } from "./core/autonomy.engine";
export { makeDecision, type DecisionOption } from "./core/decision.engine";
export { generateStrategy } from "./core/strategy.generator";

export { registerGenome, getGenomes, type Genome } from "./genome/genome.registry";
export { mutateGenome } from "./genome/genome.mutator";
export { selectTopGenomes } from "./genome/genome.selector";
export { saveVersion } from "./genome/genome.versioning";

export { evolve } from "./evolution/evolution.engine";
export { evaluateFitness } from "./evolution/fitness.evaluator";
export { replicate } from "./evolution/replication.engine";
export { prune } from "./evolution/pruning.engine";

export { learn } from "./cognition/learning.engine";
export { extractPatterns } from "./cognition/pattern.extractor";
export { predict } from "./cognition/prediction.engine";

export { applyConstraints } from "./governance/constraint.engine";
export { getApprovalBand, assertApproval, type ApprovalBand } from "./governance/approval.matrix";
export { globalKill } from "./governance/kill.switch.global";

export { storeMemory, recall } from "./memory/long.term.memory";
export { appendStrategy, readStrategies } from "./memory/strategy.memory";
export { appendDecision } from "./memory/decisions.append";
