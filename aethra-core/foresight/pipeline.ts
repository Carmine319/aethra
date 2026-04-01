import { assertForesightOperational } from "./governance/policy.gate";
import { aggregateSignals } from "./signals/signal.aggregator";
import { buildFeatures } from "./features/feature.builder";
import { normaliseFeatures } from "./features/feature.normaliser";
import { persistFeatures } from "./features/feature.store";
import { detectRegime } from "./models/regime.detector";
import { estimateUncertainty } from "./models/uncertainty.estimator";
import { forecastPoint } from "./models/forecast.engine";
import { generateScenarios } from "./scenarios/scenario.generator";
import { rankScenarios } from "./scenarios/scenario.ranker";
import { optimiseDecision } from "./decisions/decision.optimizer";
import { mapCapital } from "./decisions/capital.mapper";
import { overlayExternalPolicy } from "./decisions/policy.overlay";
import { logDecision, registerForecast } from "./registry/forecast.registry";
import { createTrustOriginReceipt } from "../trustorigin/integration";

/**
 * Single anticipatory cycle: evidence-linked signals → uncertainty-mandatory forecast → ranked scenarios → audited decision.
 */
export function runForesightCycle(input: {
  signals: any[];
  capitalBudget: number;
  decisionCandidates: Parameters<typeof optimiseDecision>[0];
  correlation_id: string;
  replay_seed?: string;
}) {
  assertForesightOperational();
  overlayExternalPolicy({ attributed: true, channelCount: input.signals?.length ?? 0 });

  const agg = aggregateSignals(input.signals);
  const rawFeatures = buildFeatures(agg);
  const features = normaliseFeatures(rawFeatures);
  persistFeatures({ correlation_id: input.correlation_id, features });

  const regime = detectRegime(features);
  const prePoint = features.reduce((s, f) => s + Number(f.momentum || 0), 0);
  const uncertainty = estimateUncertainty({
    point_estimate: prePoint,
    historical_volatility: Math.sqrt(
      agg.reduce((s, x) => s + Number(x.z_score || 0) ** 2, 0) / Math.max(1, agg.length)
    ),
  });

  const fc = forecastPoint({ features, regime, uncertainty });
  const scenarios = generateScenarios(fc.point_estimate, uncertainty);
  const ranked = rankScenarios(scenarios);

  const decision = optimiseDecision(input.decisionCandidates);
  const withCapital = mapCapital({ ...decision, confidence: uncertainty.confidence }, input.capitalBudget);

  const receipt = createTrustOriginReceipt({
    venture_id: `foresight:${input.correlation_id}`,
    business_record: { regime, replay_seed: input.replay_seed || "none" },
    execution_proof: { point: fc.point_estimate, scenarios: ranked.slice(0, 3) },
    revenue_snapshot: { expected_allocation: withCapital.allocation },
    mutation_history: [{ action: "foresight_cycle", correlation_id: input.correlation_id, ts: Date.now() }],
    previous_hash: "genesis",
  });

  logDecision({
    correlation_id: input.correlation_id,
    decision: withCapital,
    top_scenario: ranked[0],
    trustorigin_receipt_id: receipt.receipt_id,
    verification_hash: receipt.verification_hash,
  });

  registerForecast({
    id: `fc_${input.correlation_id}_${Date.now()}`,
    forecast: fc,
    uncertainty,
    regime,
    replay_seed: input.replay_seed,
  });

  return {
    aggregated_signals: agg,
    features,
    regime,
    forecast: fc,
    scenarios_ranked: ranked,
    decision: withCapital,
    trustorigin: receipt,
  };
}
