import { defineCategory } from "../category/category.engine";
import { evolveCategory } from "../category/category.evolution";
import { lockCategory } from "../category/category.lock";
import { detectWhitespace } from "../category/whitespace.detector";
import { generateNarrative } from "../narrative/narrative.engine";
import { entrenchNarrative } from "../narrative/narrative.entrenchment";
import { lockNarrative } from "../narrative/narrative.lock";
import { activateDistributionFlywheel } from "../distribution/distribution.flywheel";
import { ensureUbiquity } from "../distribution/ubiquity.engine";
import { runPerceptionLoop } from "../feedback/perception.loop";
import { runBehaviourLoop } from "../feedback/behaviour.loop";
import { runCapitalFlowLoop } from "../feedback/capital.flow.loop";
import { calculateDominanceScore } from "../feedback/dominance.score";
import { buildReinforcementPlan } from "../feedback/reinforcement.engine";
import { neutraliseCompetitors } from "../competitive/irrelevance.engine";
import { calculateExecutionVelocity } from "../speed/execution.velocity";
import { reduceLatency } from "../speed/latency.reducer";
import { createAsymmetry } from "../speed/asymmetry.engine";

type DominationLoopInput = Record<string, unknown> & {
  revenue?: number;
  spend?: number;
  adoptionRate?: number;
  creative?: Record<string, unknown>;
  conversion?: Record<string, unknown>;
  portfolio?: Record<string, unknown>;
  portfolioIntelligence?: Record<string, unknown>;
  competitorData?: Array<Record<string, unknown>>;
  behaviouralEvents?: Array<Record<string, unknown>>;
  perceptionSignals?: Array<Record<string, unknown>>;
  compoundingPolicy?: {
    repetitionMultiplier?: number;
    speedPressure?: number;
    competitorPressure?: number;
  };
};

export async function runDominationLoop(opportunity: DominationLoopInput) {
  const category = defineCategory(opportunity);
  const evolvedCategory = evolveCategory(category, [{ revenueLift: Number(opportunity.revenue || 0) }]);
  const categoryLock = lockCategory(evolvedCategory);
  const whitespace = detectWhitespace(opportunity);
  const narrative = generateNarrative(opportunity);
  const repetitionMultiplier = Number(opportunity.compoundingPolicy?.repetitionMultiplier || 1);
  const narrativeEntrenchment = entrenchNarrative(
    narrative,
    Math.max(1, Math.floor(Number(opportunity.creative?.contentCount || 6) * repetitionMultiplier))
  );
  const narrativeLock = lockNarrative(narrative, narrativeEntrenchment.entrenchmentScore);
  const channels = (opportunity.creative?.channels as string[] | undefined) || ["landing", "social", "email"];
  const contentUnits = Number(opportunity.creative?.contentCount || 5);
  const distributionFlywheel = activateDistributionFlywheel({
    channels,
    repetitions: Math.max(1, Math.floor(contentUnits * 1.2 * repetitionMultiplier)),
    contentUnits,
  });
  const ubiquity = ensureUbiquity(channels, Math.max(1, channels.length));
  const perceptionSignals = opportunity.perceptionSignals || [{
    sentiment: Number(opportunity.conversion?.analytics?.tracked?.conversionRate || 0.65),
    clarity: Number(opportunity.portfolioIntelligence?.learning?.confidence || 0.7),
  }];
  const perceptionMetrics = runPerceptionLoop(perceptionSignals);
  const behaviourEvents = opportunity.behaviouralEvents || [{
    converted: Number(opportunity.conversion?.analytics?.tracked?.conversions || 1) > 0 ? 1 : 0,
  }];
  const behaviourMetrics = runBehaviourLoop(behaviourEvents);
  const capitalFlow = runCapitalFlowLoop({
    revenue: Number(opportunity.revenue || 300),
    spend: Number(opportunity.spend || 100),
    adoptionRate: Number(opportunity.adoptionRate || 0.64),
  });
  const dominance = calculateDominanceScore({
    perceptionMetrics,
    behaviourMetrics,
    revenueMetrics: { roi: capitalFlow.roi, revenue: capitalFlow.revenue },
    adoptionMetrics: { adoptionRate: Number(opportunity.adoptionRate || 0.64) },
  });
  const competitorData = opportunity.competitorData || [
    { name: "incumbent-suite", score: 0.61 },
    { name: "manual-ops", score: 0.42 },
  ];
  const neutralisation = neutraliseCompetitors(
    competitorData,
    ["outcomes", "speed-to-revenue", "capital efficiency"]
  );
  const speedPressure = Number(opportunity.compoundingPolicy?.speedPressure || 1);
  const velocity = calculateExecutionVelocity(
    Math.max(1, Number(opportunity.executionHours || 24) / Math.max(0.5, speedPressure)),
    Number(opportunity.creative?.contentCount || 1) + Number(opportunity.conversion?.analytics?.tracked?.conversions || 1)
  );
  const latency = reduceLatency(Number(opportunity.latencyMs || 480) * (speedPressure > 1 ? 0.9 : 1));
  const competitorPressure = Number(opportunity.compoundingPolicy?.competitorPressure || 1);
  const asymmetry = createAsymmetry({
    velocity,
    competitorVelocity: Number((0.24 * competitorPressure).toFixed(4)),
    latencyGain: latency.gain,
  });
  const reinforcement = buildReinforcementPlan({
    dominanceScore: dominance.dominanceScore,
    trend: dominance.trend,
    stability: dominance.stability,
    asymmetryScore: asymmetry.asymmetryScore,
    ubiquityScore: ubiquity.ubiquityScore,
  });

  return {
    flow: [
      "define + evolve category",
      "lock category definition",
      "detect whitespace (pre-consensus)",
      "generate narrative",
      "entrench narrative",
      "lock narrative framing",
      "activate distribution flywheel",
      "ensure ubiquity",
      "track perception",
      "track behaviour",
      "track capital flow",
      "calculate dominance score",
      "neutralise competitors",
      "optimise speed + asymmetry",
      "reinforce winning structures",
      "repeat continuously",
    ],
    category: { evolvedCategory, categoryLock, whitespace },
    narrative: { narrative, narrativeEntrenchment, narrativeLock },
    distribution: { distributionFlywheel, ubiquity },
    feedback: { perceptionMetrics, behaviourMetrics, capitalFlow, dominance },
    competition: neutralisation,
    speed: { velocity, latency, asymmetry },
    reinforcement,
  };
}
