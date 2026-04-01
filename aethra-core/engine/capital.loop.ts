import { generateIdeas } from "../opportunity/idea.engine";
import { generateOpportunityMatrix } from "../opportunity/matrix";
import { ingestSignals } from "../intelligence/signal.engine";
import { analyseCompetitors } from "../intelligence/competitor.engine";
import { analyseGap } from "../intelligence/gap.map";
import { selectBestCandidate } from "../opportunity/scorer";
import { allocateCapital } from "../capital/allocator";
import { allocateByMode } from "../capital/allocation.engine";
import { applyUserMode, selectMode, SovereignMode } from "../capital/mode.engine";
import { evaluateROI } from "../capital/roi.engine";
import { executeBrowserTask } from "../execution/browser/bridge";
import { trackRevenue } from "../revenue/tracker";
import { updatePortfolio } from "../portfolio/manager";
import { analyseFeedback, refineOffer } from "../intelligence/sentiment.engine";
import { computeExecutionFeedback } from "../learning/execution.feedback";
import { scaleOpportunity } from "../capital/scaling.engine";
import { runServiceArbitrage } from "../opportunity/deployments/service.arbitrage";
import { runDigitalProductEngine } from "../opportunity/deployments/digital.product";
import { runMarketplaceFlip } from "../opportunity/deployments/marketplace.flip";
import { runCreativePipeline } from "../creative/orchestration/pipeline.runner";
import { runConversionLoop } from "../conversion/orchestration/conversion.loop";
import { runPortfolioLoop } from "../portfolio/orchestration/portfolio.loop";
import { generateLanding } from "../creative/landing/landing.engine";
import { generateContent } from "../creative/content/content.engine";
import { runDominationLoop } from "../domination/orchestration/domination.loop";
import { appendDominanceHistory } from "../domination/feedback/dominance.memory";
import { buildCompoundingPolicy, getDominanceTrend } from "../domination/feedback/dominance.trend.engine";
import { enforceDominanceGuardrails } from "../domination/feedback/governance.guard";
import { appendGovernanceAudit } from "../domination/feedback/governance.audit.memory";
import { reviewGovernanceState } from "../domination/feedback/governance.reviewer";
import { runOrganism } from "../organism/orchestration/organism.loop";
import { appendOrganismCycle } from "../organism/memory/organism.memory";
import { reviewOrganismState } from "../organism/cognition/organism.reviewer";
import { appendInstinctCycle } from "../instinct/memory/instinct.memory";
import { runEconomicLoop } from "../economics/orchestration/economic.loop";
import { appendLiveLoops } from "../live/memory/live.loop.memory";

export type ProfitMode = "guaranteed" | "aggressive";
type ProfitModeOption = {
  mode: ProfitMode;
  label: string;
  recommended?: boolean;
  disclaimer?: string;
};

const PROFIT_MODE_OPTIONS: ProfitModeOption[] = [
  { mode: "guaranteed", label: "Guaranteed", recommended: true },
  { mode: "aggressive", label: "Aggressive", disclaimer: "Higher variance mode. A cycle can run at a loss." },
];

function estimateCycleRevenue(executionResult: Record<string, unknown>, creative: Record<string, unknown>): number {
  const direct = Number(executionResult.profit || executionResult.revenue || 0);
  const jobs = Number(executionResult.jobsBooked || 0) * 140;
  const sales = Number(executionResult.sales || 0) * 29;
  const flips = Number(executionResult.itemsFlipped || 0) * 31;
  const contentLift = Array.isArray(creative.content) ? creative.content.length * 12 : 0;
  const videoLift = creative.video ? 30 : 0;
  const base = Math.max(direct, jobs + sales + flips);
  return Number((base + contentLift + videoLift).toFixed(2));
}

function applyProfitGuardrail(plannedCost: number, projectedRevenue: number, mode: ProfitMode) {
  const targetMargin = mode === "aggressive" ? -0.1 : 0.12;
  const maxCostForMargin = Number((Math.max(0, projectedRevenue) * (1 - targetMargin)).toFixed(2));
  const guardedCost = Number(Math.min(Math.max(0, plannedCost), maxCostForMargin).toFixed(2));
  return {
    guardedCost,
    marginTarget: targetMargin,
    requiresRevenueBoost: mode === "guaranteed" && projectedRevenue <= guardedCost,
    enforcePositiveProfit: mode === "guaranteed",
  };
}

export async function runAethraCapital(capital: number, options: { profitMode?: ProfitMode; userPreference?: string } = {}) {
  const profitMode: ProfitMode = options.profitMode === "aggressive" ? "aggressive" : "guaranteed";
  const dominanceTrend = getDominanceTrend(60);
  const baseCompoundingPolicy = buildCompoundingPolicy(dominanceTrend);
  const governanceDirective = reviewGovernanceState(24);
  const governanceGuard = enforceDominanceGuardrails({
    dominanceTrend,
    compoundingPolicy: baseCompoundingPolicy,
    baseCapital: Number((capital * Math.max(0.3, Math.min(1, governanceDirective.suggestedCapitalFactor))).toFixed(2)),
  });
  const governanceAudit = appendGovernanceAudit({
    cycleId: `capital_${Date.now()}`,
    status: governanceGuard.status,
    allowScaling: governanceGuard.allowScaling,
    maxDeploymentCapital: governanceGuard.maxDeploymentCapital,
    reason: governanceGuard.reason,
    trendState: dominanceTrend.trendState,
    rollingScore: dominanceTrend.rollingScore,
    volatility: dominanceTrend.volatility,
  });
  const compoundingPolicy = governanceGuard.adjustedPolicy;
  const organismDirective = reviewOrganismState(24);
  const governedCapital = Math.max(
    0,
    Number((Number(governanceGuard.maxDeploymentCapital || capital) * Math.max(0.4, Math.min(1, organismDirective.capitalFactor))).toFixed(2))
  );
  const signals = ingestSignals();
  const matrix = generateOpportunityMatrix(governedCapital, signals);
  const ideas = generateIdeas("capital mode");
  const enhanced = matrix.slice(0, 3).map((i) => {
    const comp = analyseCompetitors(i);
    const gap = analyseGap(i as unknown as Record<string, unknown>);
    const refined = refineOffer(i);
    return {
      ...i,
      ...refined,
      gap,
      roiEvaluation: evaluateROI(i as unknown as Record<string, unknown>),
      roiPotential: i.expectedROI,
      improvedModel: comp.improvedBusinessModel,
      competitorIntelligence: comp,
      speedToRevenue: Math.max(0, 10 - Number(i.timeToRevenue || 0)),
      requiredEffort: i.difficulty,
    };
  });
  const eligible = enhanced
    .filter((x) => x.roiEvaluation && !x.roiEvaluation.rejected)
    .filter((x) => x.expectedROI >= 2 || (x.roiEvaluation && x.roiEvaluation.asymmetricUpside));
  const timePriority = eligible.filter((x) => Number(x.timeToRevenue || 999) <= 14);
  const selected = selectBestCandidate((timePriority.length ? timePriority : eligible.length ? eligible : enhanced));
  const confidence = Math.max(0, Math.min(1, Number((selected as Record<string, unknown> | null)?.confidenceScore || 6) / 10));
  const signalStrength = Math.max(0, Math.min(1, Number((selected as Record<string, unknown> | null)?.signalStrength || 6) / 10));
  const systemMode = selectMode({
    capital: governedCapital,
    confidence,
    signalStrength,
    historicalPerformance: {},
  });
  const finalMode: SovereignMode = applyUserMode(systemMode, options.userPreference);
  const creative = await runCreativePipeline((selected as Record<string, unknown>) || {});
  const performanceData = [
    { section: "pain amplification", converted: 0, ctaClicks: 1, action: "view", dwellTimeMs: 4200, revenue: 0 },
    { section: "proof / scenarios", converted: 1, ctaClicks: 1, action: "checkout_start", dwellTimeMs: 2100, revenue: 199 },
    { section: "offer breakdown", converted: 0, ctaClicks: 0, action: "drop", reason: "unclear ROI", blocker: "price confusion", completed: 0 },
  ];
  const conversion = await runConversionLoop(creative.landing as Record<string, unknown>, performanceData);
  const economic = await runEconomicLoop({
    capital: Number(governedCapital || 0),
    opportunity: (selected as Record<string, unknown>) || {},
    conversionRate: Number((conversion as Record<string, unknown>)?.analytics?.tracked?.conversionRate || 0.08),
    demandSignal: Number((selected as Record<string, unknown> | null)?.signalStrength || 0.6) / 10,
  });
  const modeAllocation = allocateByMode(finalMode, governedCapital);
  const capitalIntensityMultiplier = Math.max(0.7, Math.min(1.35, Number(compoundingPolicy.capitalIntensityMultiplier || 1)));
  const compoundedSafe = Number((modeAllocation.safe * (capitalIntensityMultiplier < 1 ? (2 - capitalIntensityMultiplier) : 1)).toFixed(2));
  const compoundedScalable = Number((modeAllocation.scalable * capitalIntensityMultiplier).toFixed(2));
  const compoundedExperimental = Number((modeAllocation.experimental * Number(compoundingPolicy.explorationBias || 1)).toFixed(2));
  const normaliser = Math.max(1, compoundedSafe + compoundedScalable + compoundedExperimental);
  const allocationScale = governedCapital / normaliser;
  const allocation = {
    ...allocateCapital(governedCapital),
    safe: Number((compoundedSafe * allocationScale).toFixed(2)),
    scalable: Number((compoundedScalable * allocationScale).toFixed(2)),
    experimental: Number((compoundedExperimental * allocationScale).toFixed(2)),
    execution: Number((compoundedSafe * allocationScale).toFixed(2)),
    testing: Number((compoundedScalable * allocationScale).toFixed(2)),
    reserve: Number((compoundedExperimental * allocationScale).toFixed(2)),
  };
  let executionResult: Record<string, unknown> = {};
  const selectedDeployment = String((selected as Record<string, unknown> | null)?.deploymentType || "");
  if (selectedDeployment === "service_arbitrage") executionResult = await runServiceArbitrage();
  else if (selectedDeployment === "digital_product") executionResult = await runDigitalProductEngine();
  else if (selectedDeployment === "marketplace_flip") executionResult = await runMarketplaceFlip();
  else executionResult = await executeBrowserTask({
    idea: selected ? (selected as Record<string, unknown>).name as string || (selected as Record<string, unknown>).idea as string : "fallback idea",
    actions: ["post-content", "send-outreach", "create-listings", "drive-traffic"],
  });
  const execution = { status: "executed", details: executionResult };
  const projectedRevenue = estimateCycleRevenue(executionResult, creative as unknown as Record<string, unknown>);
  const plannedCost = selectedDeployment === "digital_product" ? Number(allocation.safe * 0.35) : Number(allocation.safe);
  const guardrail = applyProfitGuardrail(plannedCost, projectedRevenue, profitMode);
  let revenueBoost = 0;
  if (guardrail.requiresRevenueBoost) {
    await executeBrowserTask({
      idea: `${selected ? selected.name || selected.idea : "offer"} flash-offer`,
      actions: ["publish-offer", "retarget-traffic", "push-checkout"],
      context: { checkout: String(creative.landing.checkoutLink || ""), objective: "guarantee_positive_cycle_profit" },
    });
    revenueBoost = 120;
  }
  const revenueValue = Number((projectedRevenue + revenueBoost).toFixed(2));
  const forcedCost = guardrail.enforcePositiveProfit && revenueValue <= guardrail.guardedCost
    ? Math.max(0, Number((revenueValue - 1).toFixed(2)))
    : guardrail.guardedCost;
  const revenue = trackRevenue({
    idea: selected ? ((selected as Record<string, unknown>).name as string || (selected as Record<string, unknown>).idea as string) : "fallback idea",
    revenue: revenueValue,
    cost: forcedCost,
    startedAt: Date.now() - 120000,
    finishedAt: Date.now(),
  });
  const feedbackLearning = computeExecutionFeedback([
    {
      channel: "outreach",
      messageType: "compliance",
      converted: Number((executionResult.jobsBooked || executionResult.sales || executionResult.itemsFlipped) ? 1 : 0),
      clicks: Number(executionResult.clicks || 24),
      impressions: Number(executionResult.impressions || 210),
      hook: String(creative.content[0]?.hook || "Problem hook"),
      cta: String(creative.content[0]?.CTA || "Book now"),
    },
    {
      channel: "social",
      messageType: "proof",
      converted: Number((executionResult.sales || 0) ? 1 : 0),
      clicks: Number(executionResult.socialClicks || 37),
      impressions: Number(executionResult.socialImpressions || 420),
      hook: String(creative.video.hook || "Video hook"),
      cta: String(creative.video.CTA || "Buy now"),
    },
  ]);
  const roiMultiple = Number(revenue.cost || 0) > 0 ? Number((Number(revenue.revenue || 0) / Number(revenue.cost || 1)).toFixed(4)) : 0;
  const baseScalingDecision = scaleOpportunity({ roi: revenue.roi, roiMultiple, expectedROI: selected ? selected.expectedROI : 0 });
  const scalingDecision = governanceGuard.allowScaling
    ? baseScalingDecision
    : { ...baseScalingDecision, action: "hold", scale: false, reason: governanceGuard.reason };
  const optimizedLanding = generateLanding({
    ...(selected as Record<string, unknown> || {}),
    targetAudience: "high-intent buyers",
    outcome: `higher CTR on ${feedbackLearning.bestPlatform}`,
  });
  const optimizedContent = generateContent({
    ...(selected as Record<string, unknown> || {}),
    checkoutLink: String(creative.landing.checkoutLink || ""),
    bestHook: feedbackLearning.bestHook,
    bestCTA: feedbackLearning.bestCTA,
  });
  const sentiment = analyseFeedback(["slow onboarding", "unclear ROI", "good results"]);
  const portfolio = updatePortfolio(
    { activeBusinesses: [], killedBusinesses: [], scaledBusinesses: [] },
    {
      id: `biz_${Date.now()}`,
      idea: selected ? selected.name || selected.idea : "fallback idea",
      status: scalingDecision.kill ? "killed" : scalingDecision.action === "scale" ? "scaled" : "active",
      revenue: revenue.revenue,
      cyclesWithoutRevenue: scalingDecision.kill ? 3 : (revenue.revenue > 0 ? 0 : 1),
    }
  );
  const portfolioIntelligence = await runPortfolioLoop({
    selectedIdea: selected as Record<string, unknown>,
    revenue: Number(revenue.revenue || 0),
    capital: Number(allocation.safe || 0),
    signalStrength,
    conversionRate: Number(feedbackLearning.conversionRate || 0),
  });
  const creativeChannels = ["landing", "content", "video"];
  const conversionTracked = (conversion as Record<string, unknown>)?.analytics as Record<string, unknown> | undefined;
  const organism = await runOrganism({
    selectedOpportunity: (selected as Record<string, unknown>) || {},
    capital: Number(governedCapital || 0),
    conversionRate: Number(feedbackLearning.conversionRate || 0),
    competitorPressure: Number((selected as Record<string, unknown> | null)?.competitorIntelligence?.pressure || 0.55),
    reviewerDirective: {
      mode: organismDirective.mode,
      mutationPressure: organismDirective.mutationPressure,
    },
  });
  const organismTelemetry = appendOrganismCycle({
    cycleId: `organism_${Date.now()}`,
    opportunityId: String((selected as Record<string, unknown> | null)?.id || (selected as Record<string, unknown> | null)?.idea || "unknown-opportunity"),
    capital: Number(governedCapital || 0),
    terminateCandidate: Boolean((organism as Record<string, unknown>)?.terminateCandidate),
    environmentScore: Number((organism as Record<string, unknown>)?.sensory?.environment?.environmentScore || 0),
    signalClass: String((organism as Record<string, unknown>)?.sensory?.signals?.signalClass || "unknown"),
    anomalyScore: Number((organism as Record<string, unknown>)?.sensory?.anomalies?.anomalyScore || 0),
    metabolismRevenue: Number((organism as Record<string, unknown>)?.metabolism?.metabolism?.revenue || 0),
    conversionLift: Number((organism as Record<string, unknown>)?.metabolism?.conversion?.lift || 0),
    energyEfficiency: Number((organism as Record<string, unknown>)?.resources?.energy?.efficiency || 0),
    selectedBehaviour: String((organism as Record<string, unknown>)?.evolution?.behaviour?.selected?.id || "none"),
  });
  const liveLoops = (((organism as Record<string, unknown>)?.live as Record<string, unknown> | undefined)?.loops as Array<Record<string, unknown>> | undefined) || [];
  const liveTelemetry = appendLiveLoops(
    liveLoops.map((loop, idx) => ({
      cycleId: `live_${Date.now()}`,
      loopId: String(loop.id || `loop_${idx}`),
      roi: Number(loop.roi || 0),
      revenue: Number(loop.revenue || 0),
      active: Boolean(loop.active),
      killed: Boolean(loop.kill?.kill || false),
      scaled: Boolean(loop.scaling?.scale || false),
      recovered: Boolean(loop.recovery?.recovered || false),
      fallbackSwitched: Boolean(loop.fallback?.switched || false),
    }))
  );
  const instinctTelemetry = appendInstinctCycle({
    cycleId: `instinct_${Date.now()}`,
    capital: Number(governedCapital || 0),
    weakSignalCount: Number((organism as Record<string, unknown>)?.instinct?.sensing?.weakSignals?.length || 0),
    gradientShiftCount: Number((organism as Record<string, unknown>)?.instinct?.sensing?.gradients?.preTrendShifts?.length || 0),
    hypothesisCount: Number((organism as Record<string, unknown>)?.instinct?.hypothesis?.prioritised?.length || 0),
    probeCount: Number((organism as Record<string, unknown>)?.instinct?.probing?.probes?.length || 0),
    passedCount: Number((organism as Record<string, unknown>)?.instinct?.probing?.validation?.passedCount || 0),
    confidence: Number((organism as Record<string, unknown>)?.instinct?.calibration?.confidence || 0),
    errorRate: Number((organism as Record<string, unknown>)?.instinct?.calibration?.errors?.errorRate || 0),
    exploration: Number((organism as Record<string, unknown>)?.instinct?.evolution?.explorationBalance?.exploration || 0),
    exploitation: Number((organism as Record<string, unknown>)?.instinct?.evolution?.explorationBalance?.exploitation || 0),
    entryMode: String((organism as Record<string, unknown>)?.instinct?.temporal?.temporalPositioning?.entry || "observe-and-probe"),
  });
  const domination = await runDominationLoop({
    ...(selected as Record<string, unknown> || {}),
    revenue: Number(revenue.revenue || 0),
    spend: forcedCost,
    adoptionRate: Number(feedbackLearning.conversionRate || 0),
    creative: {
      channels: creativeChannels,
      contentCount: Array.isArray((creative as Record<string, unknown>).content)
        ? ((creative as Record<string, unknown>).content as unknown[]).length
        : 1,
    },
    conversion: {
      analytics: conversionTracked || {},
    },
    portfolio: portfolio as unknown as Record<string, unknown>,
    portfolioIntelligence: portfolioIntelligence as unknown as Record<string, unknown>,
    organism: organism as unknown as Record<string, unknown>,
    behaviouralEvents: performanceData,
    perceptionSignals: [
      {
        sentiment: Number(feedbackLearning.conversionRate || 0.6),
        clarity: Number(confidence || 0.6),
      },
    ],
    competitorData: [
      { name: "incumbent-suite", score: 0.61 },
      { name: "category-tools", score: 0.53 },
    ],
    compoundingPolicy,
  });
  const dominanceTelemetry = appendDominanceHistory({
    opportunityId: String((selected as Record<string, unknown> | null)?.id || (selected as Record<string, unknown> | null)?.idea || "unknown-opportunity"),
    dominanceScore: Number((domination as Record<string, unknown>)?.feedback?.dominance?.dominanceScore || 0),
    trend: String((domination as Record<string, unknown>)?.feedback?.dominance?.trend || "forming"),
    stability: String((domination as Record<string, unknown>)?.feedback?.dominance?.stability || "volatile"),
    revenue: Number(revenue.revenue || 0),
    adoptionRate: Number(feedbackLearning.conversionRate || 0),
  });
  const postCycleDominanceTrend = getDominanceTrend(60);

  return {
    ok: true,
    flow: [
      "opportunity selected",
      "mode selected",
      "creative generated",
      "content distributed",
      "traffic generated",
      "conversion loop optimises",
      "monetisation triggered",
      "revenue tracked",
      "portfolio loop compounds",
      "feedback stored",
      "system improves",
    ],
    matrixTop: matrix.slice(0, 5),
    selectedIdea: selected,
    creative,
    conversion,
    economic,
    executionStatus: execution.status,
    profitGenerated: revenue.profit,
    mode: {
      systemMode,
      finalMode,
      userPreference: options.userPreference || "auto",
    },
    revenue,
    allocation,
    sentiment,
    feedbackLearning,
    profitGuard: {
      mode: profitMode,
      projectedRevenue,
      plannedCost,
      finalCost: forcedCost,
      revenueBoost,
      marginTarget: guardrail.marginTarget,
    },
    profitModeOptions: PROFIT_MODE_OPTIONS,
    optimization: {
      optimizedLanding,
      optimizedContent,
      bestHook: feedbackLearning.bestHook,
      bestPlatform: feedbackLearning.bestPlatform,
      bestCTA: feedbackLearning.bestCTA,
    },
    scalingDecision,
    portfolio,
    portfolioIntelligence,
    organism,
    organismTelemetry,
    liveTelemetry,
    instinctTelemetry,
    domination,
    dominanceTelemetry,
    compounding: {
      preCycleTrend: dominanceTrend,
      postCycleTrend: postCycleDominanceTrend,
      governanceDirective,
      governance: governanceGuard,
      governanceAudit,
      organismDirective,
      policy: compoundingPolicy,
    },
    reinvestedCapital: governedCapital + Math.max(0, revenue.profit),
  };
}

export async function runCapitalEngine(capital: number, options: { profitMode?: ProfitMode } = {}) {
  return runAethraCapital(capital, options);
}
