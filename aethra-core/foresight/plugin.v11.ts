/**
 * AETHRA v11 — Strategic Foresight (additive plugin surface).
 */

export { assertForesightOperational, readForesightPolicy } from "./governance/policy.gate";

export { wrapRawSignal, type SignalProvenance } from "./signals/source.adapters";
export { filterNoise } from "./signals/noise.filter";
export { detectSignalAnomalies } from "./signals/anomaly.detector";
export { weightSignals } from "./signals/signal.weighting";
export { aggregateSignals } from "./signals/signal.aggregator";

export { buildFeatures } from "./features/feature.builder";
export { normaliseFeatures } from "./features/feature.normaliser";
export { persistFeatures } from "./features/feature.store";
export { measureDrift } from "./features/drift.monitor";

export { detectRegime } from "./models/regime.detector";
export { estimateUncertainty, type UncertaintyBundle } from "./models/uncertainty.estimator";
export { forecastPoint } from "./models/forecast.engine";
export { ensembleForecast } from "./models/ensemble.engine";
export { calibrateConfidence } from "./models/calibration.engine";

export { generateScenarios } from "./scenarios/scenario.generator";
export { simulateScenarioPath } from "./scenarios/scenario.simulator";
export { stressTest } from "./scenarios/stress.test";
export { rankScenarios } from "./scenarios/scenario.ranker";

export { optimiseDecision, type DecisionCandidate } from "./decisions/decision.optimizer";
export { overlayExternalPolicy } from "./decisions/policy.overlay";
export { mapDecisionToActions } from "./decisions/action.mapper";
export { mapCapital } from "./decisions/capital.mapper";

export { runBacktest } from "./backtesting/backtest.engine";
export { hitRate, meanAbsoluteError } from "./backtesting/metrics";
export { attributePerformance } from "./backtesting/performance.attribution";

export {
  appendOutcome,
  appendDecisionAudit,
  registerForecast,
  listForecasts,
  logDecision,
  getLoggedDecisions,
  type ForecastRecord,
} from "./registry/forecast.registry";

export { runForesightCycle } from "./pipeline";
