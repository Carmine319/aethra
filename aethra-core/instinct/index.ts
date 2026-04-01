export { runInstinctLoop } from "./orchestration/instinct.loop";
export { detectGradients } from "./sensing/anomaly.gradient";
export { mutateHypotheses } from "./hypothesis/hypothesis.mutation";
export { runProbe, runParallelProbes } from "./probing/micro.probe.engine";
export { balanceStrategies } from "./evolution/exploration.balance";
export { evolveHypotheses } from "./evolution/hypothesis.evolution";
export { appendInstinctCycle, getRecentInstinctCycles, readRecentInstinctCycles } from "./memory/instinct.memory";
