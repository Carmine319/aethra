import { detectWeakSignals } from "../sensing/weak.signal.detector";
import { fragmentPatterns } from "../sensing/pattern.fragmenter";
import { weightSignals } from "../sensing/signal.weighting";
import { detectGradients } from "../sensing/anomaly.gradient";
import { synthesizeHypotheses } from "../hypothesis/hypothesis.engine";
import { generateTheses } from "../hypothesis/thesis.generator";
import { mutateHypotheses } from "../hypothesis/hypothesis.mutation";
import { buildScenarios } from "../projection/scenario.builder";
import { mapOutcomes } from "../projection/outcome.mapper";
import { createProbabilityDistribution } from "../projection/probability.distribution";
import { prioritiseHypotheses } from "../hypothesis/hypothesis.prioritiser";
import { runParallelProbes } from "../probing/micro.probe.engine";
import { validateProbeResults } from "../probing/rapid.validation";
import { scoreConfidence } from "../calibration/confidence.scorer";
import { trackErrors } from "../calibration/error.tracker";
import { appendCalibrationMemory } from "../calibration/calibration.memory";
import { selfAdjust } from "../correction/self.adjustment";
import { updateStrategy } from "../correction/strategy.update";
import { correctBias } from "../correction/bias.correction";
import { balanceStrategies } from "../evolution/exploration.balance";
import { evolveHypotheses } from "../evolution/hypothesis.evolution";
import { determineTemporalPositioning } from "../temporal/positioning.engine";
import { selectEarlyEntries } from "../temporal/early.entry.selector";

export async function runInstinctLoop(input: {
  capital: number;
  signals: Array<Record<string, unknown>>;
}) {
  const weakSignals = detectWeakSignals(input.signals);
  const gradients = detectGradients(weakSignals);
  const fragments = fragmentPatterns(weakSignals);
  const weighted = weightSignals(fragments);
  const baseHypotheses = synthesizeHypotheses(weighted.weighted);
  const mutated = mutateHypotheses(baseHypotheses);
  const allHypotheses = [...baseHypotheses, ...mutated];
  const theses = generateTheses(allHypotheses);
  const scenarios = buildScenarios(allHypotheses);
  const mappedOutcomes = mapOutcomes(scenarios);
  const distribution = createProbabilityDistribution(mappedOutcomes);
  const prioritised = prioritiseHypotheses(allHypotheses);
  const probes = runParallelProbes(prioritised, Number(input.capital || 0));
  const validation = validateProbeResults(probes);
  const confidence = scoreConfidence(validation);
  const errors = trackErrors(probes);
  const calibration = appendCalibrationMemory(confidence, errors.errorRate);
  const adjustment = selfAdjust(confidence, errors.errorRate);
  const strategyUpdate = updateStrategy(adjustment);
  const bias = correctBias(errors.errorRate, confidence);
  const explorationBalance = balanceStrategies(confidence, Number((1 - confidence).toFixed(4)));
  const evolution = evolveHypotheses(probes);
  const temporalPositioning = determineTemporalPositioning(confidence, Number((1 - confidence).toFixed(4)));
  const earlyEntries = selectEarlyEntries(distribution);
  const escalations = validation.winners.slice(0, 3);

  return {
    flow: [
      "detect signal fragments + gradients",
      "weight signals",
      "generate hypotheses",
      "mutate hypotheses",
      "model probability distributions",
      "prioritise hypotheses",
      "run micro-probes",
      "evaluate outcomes",
      "update confidence + calibration",
      "correct biases",
      "balance exploration vs exploitation",
      "evolve hypothesis logic",
      "determine temporal positioning",
      "escalate validated opportunities",
      "repeat continuously",
    ],
    sensing: { weakSignals, gradients, fragments, weighted },
    hypothesis: { baseHypotheses, mutated, theses, prioritised },
    projection: { scenarios, mappedOutcomes, distribution },
    probing: { probes, validation },
    calibration: { confidence, errors, calibration },
    correction: { adjustment, strategyUpdate, bias },
    evolution: { explorationBalance, evolution },
    temporal: { temporalPositioning, earlyEntries },
    escalations,
  };
}
