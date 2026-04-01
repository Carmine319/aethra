import { scanEnvironment } from "../sensory/environment.scanner";
import { detectSignals } from "../sensory/signal.detector";
import { senseAnomalies } from "../sensory/anomaly.sense";
import { convertOpportunityToRevenue } from "../metabolism/revenue.engine";
import { amplifyConversion } from "../metabolism/conversion.amplifier";
import { buildMonetisationPaths } from "../metabolism/monetisation.paths";
import { dispatchActions, reduceFriction, runSocialLoop } from "../motor/action.dispatcher";
import { executeActions } from "../motor/execution.engine";
import { learnFromOutcomes } from "../cognition/learning.engine";
import { adaptDecisions, optimiseExternalBusiness } from "../cognition/decision.adaptation";
import { getBestPatterns, storePattern } from "../cognition/pattern.memory";
import { allocateOrganismCapital } from "../resources/capital.distribution";
import { optimiseEnergy } from "../resources/energy.optimiser";
import { mutateStrategy } from "../evolution/strategy.mutation";
import { selectBehaviour } from "../evolution/behaviour.selection";
import { runInstinctLoop } from "../../instinct/orchestration/instinct.loop";
import { runConsciousnessLoop } from "../../consciousness/orchestration/consciousness.loop";
import { runReliabilityLoop } from "../../reliability/orchestration/reliability.loop";
import { runLiveLoop } from "../../live/orchestration/live.loop";
import { runEconomicLoop } from "../../economics/orchestration/economic.loop";

export async function runOrganism(input: {
  selectedOpportunity: Record<string, unknown>;
  capital: number;
  conversionRate: number;
  competitorPressure: number;
  reviewerDirective?: {
    mode: "normal" | "recovery_mutation" | "termination_watch";
    mutationPressure: number;
  };
}) {
  const instinct = await runInstinctLoop({
    capital: Number(input.capital || 0),
    signals: [
      { id: "demand-fragment", strength: 0.42, direction: 0.38, confidence: 0.46 },
      { id: "pricing-fragment", strength: 0.31, direction: -0.12, confidence: 0.41 },
      { id: "social-fragment", strength: 0.58, direction: 0.44, confidence: 0.54 },
      {
        id: "opportunity-fragment",
        strength: Number((input.selectedOpportunity.signalStrength as number) || 0.45),
        direction: Number((input.selectedOpportunity.expectedROI as number) || 0.3) / 4,
        confidence: Number((input.selectedOpportunity.confidenceScore as number) || 0.5) / 10,
      },
    ],
  });
  const reliability = await runReliabilityLoop({
    bookedRevenue: 220,
    settledRevenue: 220,
    reportedProfit: 120,
    calculatedProfit: 120,
    channels: [
      { name: "social", postingOk: true, deliveryOk: true, engagement: 0.06 },
      { name: "email", postingOk: true, deliveryOk: true, engagement: 0.11 },
      { name: "search", postingOk: true, deliveryOk: true, engagement: 0.08 },
    ],
    errorRate: 0.07,
    executionSuccess: 0.93,
    latencyMs: 1240,
    revenueFlow: 0.74,
    revenueDrop: 0.09,
    conversionDrop: 0.05,
    behaviourDrift: 0.04,
  });
  if (!reliability.gate.canExecute) {
    return {
      lifecycle: ["run reliability loop", "execution blocked by reliability gate"],
      reliability,
      blocked: true,
      terminateCandidate: false,
    };
  }
  const live = await runLiveLoop({
    capital: Number(input.capital || 0),
    opportunities: [
      input.selectedOpportunity,
      { ...input.selectedOpportunity, signalStrength: Number((input.selectedOpportunity.signalStrength as number) || 0.5) * 0.92, basePrice: 149 },
      { ...input.selectedOpportunity, signalStrength: Number((input.selectedOpportunity.signalStrength as number) || 0.5) * 0.85, basePrice: 249 },
    ],
  });
  const economic = await runEconomicLoop({
    capital: Number(input.capital || 0),
    opportunity: input.selectedOpportunity,
    conversionRate: Number((live.activeLoops[0]?.conversionOptimised?.conversionRate as number) || input.conversionRate || 0.08),
    demandSignal: Number((input.selectedOpportunity.signalStrength as number) || 0.6) / 10,
  });
  const consciousness = await runConsciousnessLoop({
    capital: Number(input.capital || 0),
    dependencyIndex: 0.4,
    volatility: Number(input.competitorPressure || 0.55),
    performanceDrop: 0.18,
    errorRate: 0.14,
  });
  const environment = scanEnvironment({
    socialSignals: [{ engagement: 0.64 }],
    marketDemand: [{ score: 0.7 }],
    competitorBehaviour: [{ pressure: Number(input.competitorPressure || 0.55) }],
    pricingSignals: [{ volatility: 0.42 }],
  });
  const signals = detectSignals(environment);
  const anomalies = senseAnomalies({
    threatCount: (environment.threats as string[]).length,
    inefficiencyCount: (environment.inefficiencies as string[]).length,
    scoreDrift: Math.max(0, 0.6 - Number(environment.environmentScore || 0.5)),
  });
  const actions = dispatchActions({ launchOffer: true, deployLanding: true, runCampaigns: true, operateSocial: true });
  const execution = executeActions({ actions, automationLevel: 0.82 });
  const social = runSocialLoop(["x", "linkedin", "youtube"]);
  const friction = reduceFriction(4);
  const monetisation = buildMonetisationPaths(input.selectedOpportunity);
  const conversion = amplifyConversion({
    conversionRate: Number(input.conversionRate || 0.08),
    friction: execution.frictionScore,
    trust: Number((instinct.calibration?.confidence as number) || 0.72),
  });
  const metabolism = convertOpportunityToRevenue({
    ...input.selectedOpportunity,
    intent: signals.confidence,
    clarity: Math.max(0.4, 1 - anomalies.anomalyScore * 0.2),
    speed: Math.max(0.4, 1 - execution.frictionScore),
    baseRevenue: 140,
  });
  const outcomes = [
    { revenue: metabolism.revenue, cost: Number(input.capital || 0) * 0.25, pattern: monetisation.primaryPath },
    { revenue: Number((metabolism.revenue * conversion.improvedRate).toFixed(2)), cost: Number(input.capital || 0) * 0.1, pattern: "conversion-amplified" },
  ];
  const learning = learnFromOutcomes(outcomes);
  storePattern(String(monetisation.primaryPath || "unknown"), learning.winRate);
  const decisionAdaptation = adaptDecisions(learning);
  const externalBusinessOptimisation = optimiseExternalBusiness(input.selectedOpportunity);
  const capitalDistribution = allocateOrganismCapital(Number(input.capital || 0), learning);
  const energy = optimiseEnergy({
    revenue: metabolism.revenue,
    spend: Number(input.capital || 0) * 0.35,
    manualSteps: 4 - friction.automatedSteps,
  });
  const mutationPressure = Number(input.reviewerDirective?.mutationPressure || 1);
  const mutated = mutateStrategy({
    strategyMode: decisionAdaptation.strategyMode,
    bestPatterns: getBestPatterns(3),
    mutationPressure,
  });
  const behaviour = selectBehaviour([
    { id: "exploit-proven", score: learning.winRate + (energy.efficiency * 0.1) - (mutationPressure > 1 ? 0.05 : 0) },
    { id: "test-variants", score: (1 - learning.failRate) + (mutationPressure > 1 ? 0.08 : 0) },
    { id: "defensive-optimise", score: anomalies.requiresIntervention ? 0.9 : 0.45 },
  ]);

  return {
    lifecycle: [
      "run instinct loop",
      "run live loop",
      "run economic loop",
      "run reliability loop",
      "run consciousness loop",
      "sense environment",
      "detect opportunities",
      "deploy actions",
      "generate revenue",
      "analyse results",
      "reallocate capital",
      "evolve behaviour",
      "repeat continuously",
    ],
    reliability,
    live,
    economic,
    consciousness,
    sensory: { environment, signals, anomalies },
    instinct,
    motor: { actions, execution, social, friction },
    metabolism: { monetisation, conversion, metabolism },
    cognition: { learning, decisionAdaptation, externalBusinessOptimisation },
    resources: { capitalDistribution, energy },
    evolution: { mutated, behaviour },
    reviewer: input.reviewerDirective || { mode: "normal", mutationPressure: 1 },
    terminateCandidate: energy.shouldTerminate,
  };
}
