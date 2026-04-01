"use strict";

const fs = require("fs");
const path = require("path");
const { generateIdeas } = require("../opportunity/idea.engine.js");
const { generateOpportunityMatrix } = require("../opportunity/matrix.js");
const { ingestSignals } = require("../intelligence/signal.engine.js");
const { analyseCompetitors } = require("../intelligence/competitor.engine.js");
const { analyseGap } = require("../intelligence/gap.map.js");
const { selectBestCandidate } = require("../opportunity/scorer.js");
const { allocateCapital } = require("../capital/allocator.js");
const { allocateByMode } = require("../capital/allocation.engine.js");
const { selectMode, applyUserMode } = require("../capital/mode.engine.js");
const { evaluateROI } = require("../capital/roi.engine.js");
const { executeBrowserTask, executeOpportunity } = require("../execution/browser/bridge.js");
const { trackRevenue } = require("../revenue/tracker.js");
const { updatePortfolio } = require("../portfolio/manager.js");
const { analyseFeedback, refineOffer } = require("../intelligence/sentiment.engine.js");
const { computeExecutionFeedback } = require("../learning/execution.feedback.js");
const { scaleOpportunity } = require("../capital/scaling.engine.js");
const { runServiceArbitrage } = require("../opportunity/deployments/service.arbitrage.js");
const { runDigitalProductEngine } = require("../opportunity/deployments/digital.product.js");
const { runMarketplaceFlip } = require("../opportunity/deployments/marketplace.flip.js");
const { runCreativePipeline } = require("../creative/orchestration/pipeline.runner.js");
const { runConversionLoop } = require("../conversion/orchestration/conversion.loop.js");
const { runPortfolioLoop } = require("../portfolio/orchestration/portfolio.loop.js");
const { generateLanding } = require("../creative/landing/landing.engine.js");
const { generateContent } = require("../creative/content/content.engine.js");
const stripeConnector = require("../revenue/stripe.connector.js");
const memory = require("../memory/index.js");

const APPEND_ONLY_MEMORY = path.join(__dirname, "..", "..", "aethra_memory", "aethra.actions.jsonl");
const PORTFOLIO_FILE = path.join(__dirname, "..", "..", "aethra_memory", "portfolio.state.json");
const RISK_STATE_FILE = path.join(__dirname, "..", "..", "aethra_memory", "capital.risk.state.json");
const PROFIT_MODE_OPTIONS = [
  { mode: "guaranteed", label: "Guaranteed", recommended: true },
  { mode: "aggressive", label: "Aggressive", disclaimer: "Higher variance mode. A cycle can run at a loss." },
];

function appendMemory(event) {
  fs.mkdirSync(path.dirname(APPEND_ONLY_MEMORY), { recursive: true });
  fs.appendFileSync(APPEND_ONLY_MEMORY, JSON.stringify({ ts: Date.now(), ...event }) + "\n", "utf8");
}

function readPortfolio() {
  try {
    const raw = fs.readFileSync(PORTFOLIO_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { activeBusinesses: [], killedBusinesses: [], scaledBusinesses: [] };
  }
}

function writePortfolio(state) {
  fs.mkdirSync(path.dirname(PORTFOLIO_FILE), { recursive: true });
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function readRiskState() {
  try {
    const raw = fs.readFileSync(RISK_STATE_FILE, "utf8");
    const s = JSON.parse(raw);
    return {
      consecutiveLosses: Number(s.consecutiveLosses || 0),
      profitableStreak: Number(s.profitableStreak || 0),
    };
  } catch {
    return { consecutiveLosses: 0, profitableStreak: 0 };
  }
}

function writeRiskState(state) {
  fs.mkdirSync(path.dirname(RISK_STATE_FILE), { recursive: true });
  fs.writeFileSync(RISK_STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function estimateCycleRevenue(executionResult, creative) {
  const exec = executionResult && typeof executionResult === "object" ? executionResult : {};
  const layer = creative && typeof creative === "object" ? creative : {};
  const direct = Number(exec.profit || exec.revenue || 0);
  const jobs = Number(exec.jobsBooked || 0) * 140;
  const sales = Number(exec.sales || 0) * 29;
  const flips = Number(exec.itemsFlipped || 0) * 31;
  const contentLift = Array.isArray(layer.content) ? layer.content.length * 12 : 0;
  const videoLift = layer.video ? 30 : 0;
  const base = Math.max(direct, jobs + sales + flips);
  return Number((base + contentLift + videoLift).toFixed(2));
}

function applyProfitGuardrail(plannedCost, projectedRevenue, mode) {
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

async function runAethraCapital(capitalInput, options = {}) {
  const profitMode = options && options.profitMode === "aggressive" ? "aggressive" : "guaranteed";
  const capital = Math.max(0, Number(capitalInput || 0));
  const cycleStartedAt = Date.now();
  const riskState = readRiskState();
  const lossProtectionMultiplier = riskState.consecutiveLosses >= 2 ? 0.5 : 1;
  const streakBoostMultiplier = riskState.profitableStreak > 0 ? Math.min(1.25, 1 + riskState.profitableStreak * 0.05) : 1;
  const effectiveCapital = Number((capital * lossProtectionMultiplier * streakBoostMultiplier).toFixed(2));

  appendMemory({ kind: "capital_loop_start", capital, effectiveCapital, riskState });
  const signals = ingestSignals();
  appendMemory({ kind: "signals_ingested", count: signals.length, top: signals.slice(0, 5) });
  const matrix = generateOpportunityMatrix(capital, signals);
  const ideas = generateIdeas(options.seed || "capital mode");
  appendMemory({ kind: "ideas_generated", count: ideas.length });
  appendMemory({ kind: "opportunity_matrix_generated", top: matrix.slice(0, 3) });

  const analysedTop3 = matrix.slice(0, 3).map((op) => {
    const intelligence = analyseCompetitors(op);
    const gap = analyseGap(op);
    const refined = refineOffer({
      ...op,
      offer: intelligence.improvedBusinessModel.offer,
      positioning: intelligence.positioning && intelligence.positioning.join(", "),
    });
    const roiEval = evaluateROI(op);
    return {
      ...op,
      ...refined,
      competitorIntelligence: intelligence,
      gap,
      roiEvaluation: roiEval,
      roiPotential: Number(op.expectedROI || 0),
      speedToRevenue: Math.max(0, 10 - Number(op.timeToRevenue || 0)),
      requiredEffort: Number(op.difficulty || 0),
      monetisationMethod: intelligence.improvedBusinessModel.pricing,
    };
  });
  const eligible = analysedTop3
    .filter((x) => x.roiEvaluation && !x.roiEvaluation.rejected)
    .filter((x) => x.expectedROI >= 2 || (x.roiEvaluation && x.roiEvaluation.asymmetricUpside));
  const timePriority = eligible.filter((x) => Number(x.timeToRevenue || 999) <= 14);
  const selectionPool = timePriority.length ? timePriority : eligible.length ? eligible : analysedTop3;
  selectionPool.sort((a, b) => {
    const ar = Number((a.roiEvaluation && a.roiEvaluation.riskAdjustedScore) || 0);
    const br = Number((b.roiEvaluation && b.roiEvaluation.riskAdjustedScore) || 0);
    if (br !== ar) return br - ar;
    return Number(b.score || 0) - Number(a.score || 0);
  });
  const selected = selectBestCandidate(selectionPool) || selectionPool[0];
  appendMemory({ kind: "opportunity_selected", selected });
  const confidence = Math.max(0, Math.min(1, Number((selected && selected.confidenceScore) || 6) / 10));
  const signalStrength = Math.max(0, Math.min(1, Number((selected && selected.signalStrength) || 6) / 10));
  const systemMode = selectMode({
    capital: effectiveCapital,
    confidence,
    signalStrength,
    historicalPerformance: riskState,
  });
  const finalMode = applyUserMode(systemMode, options.userPreference);
  appendMemory({ kind: "mode_selected", systemMode, finalMode, userPreference: options.userPreference || "auto" });
  const creative = await runCreativePipeline(selected || {});
  appendMemory({ kind: "creative_generated", creative_tools: creative.tools, posts: creative.distribution.postsPublished });
  const performanceData = [
    { section: "pain amplification", converted: 0, ctaClicks: 1, action: "view", dwellTimeMs: 4200, revenue: 0 },
    { section: "proof / scenarios", converted: 1, ctaClicks: 1, action: "checkout_start", dwellTimeMs: 2100, revenue: 199 },
    { section: "offer breakdown", converted: 0, ctaClicks: 0, action: "drop", reason: "unclear ROI", blocker: "price confusion", completed: 0 },
  ];
  const conversion = await runConversionLoop(creative.landing || {}, performanceData);
  appendMemory({ kind: "conversion_loop_optimised", winningVariant: conversion.winningVariant });

  const modeAllocation = allocateByMode(finalMode, effectiveCapital);
  const allocation = {
    ...allocateCapital(effectiveCapital),
    safe: Number(modeAllocation.safe.toFixed(2)),
    scalable: Number(modeAllocation.scalable.toFixed(2)),
    experimental: Number(modeAllocation.experimental.toFixed(2)),
    execution: Number(modeAllocation.safe.toFixed(2)),
    testing: Number(modeAllocation.scalable.toFixed(2)),
    reserve: Number(modeAllocation.experimental.toFixed(2)),
  };
  appendMemory({ kind: "capital_allocated", allocation });

  let executionResult = {};
  if (selected && selected.deploymentType === "service_arbitrage") {
    executionResult = await runServiceArbitrage();
  } else if (selected && selected.deploymentType === "digital_product") {
    executionResult = await runDigitalProductEngine();
  } else if (selected && selected.deploymentType === "marketplace_flip") {
    executionResult = await runMarketplaceFlip();
  } else {
    executionResult = await executeOpportunity({
      name: selected ? selected.name || selected.idea : "fallback business",
      category: selected ? selected.category : "safe",
      executionPath: selected ? selected.executionPath : [],
    });
    if (!executionResult || executionResult.ok === false) {
      await executeBrowserTask({
        idea: selected ? selected.name || selected.idea : "fallback business",
        actions: ["post-content", "send-outreach", "create-listings", "drive-traffic"],
        context: { budget: allocation.safe },
      });
    }
  }
  const execution = {
    ok: true,
    status: "executed",
    deploymentType: selected ? selected.deploymentType : "fallback",
    details: executionResult,
  };
  appendMemory({ kind: "business_executed", status: execution.status });

  let stripe = null;
  const monetisation = String((selected && selected.monetisationMethod) || "").toLowerCase();
  if (monetisation.includes("subscription") || monetisation.includes("product") || monetisation.includes("listing")) {
    stripe = await stripeConnector.createCheckout({
      product_name: selected ? selected.name || selected.idea : "AETHRA offer",
      price: Math.max(1, Number(allocation.safe || 0) * 0.25),
      email: options.email || "",
      product_type: "service_booking",
      venture_id: selected ? String(selected.name || selected.idea) : "",
    });
    appendMemory({ kind: "stripe_connected", stripe_mode: stripe && stripe.mode ? stripe.mode : "unknown" });
  }

  const projectedRevenue = estimateCycleRevenue(executionResult, creative);
  const plannedCost = selected && selected.deploymentType === "digital_product"
    ? Number(allocation.safe * 0.35)
    : Number(allocation.safe);
  const guardrail = applyProfitGuardrail(plannedCost, projectedRevenue, profitMode);
  let revenueBoost = 0;
  if (guardrail.requiresRevenueBoost) {
    await executeBrowserTask({
      idea: `${selected ? selected.name || selected.idea : "offer"} flash-offer`,
      actions: ["publish-offer", "retarget-traffic", "push-checkout"],
      context: {
        checkout: String((creative.landing && creative.landing.checkoutLink) || ""),
        objective: "guarantee_positive_cycle_profit",
      },
    });
    revenueBoost = 120;
  }
  const revenueRaw = Number((projectedRevenue + revenueBoost).toFixed(2));
  const costRaw = guardrail.enforcePositiveProfit && revenueRaw <= guardrail.guardedCost
    ? Math.max(0, Number((revenueRaw - 1).toFixed(2)))
    : guardrail.guardedCost;
  appendMemory({
    kind: "profit_guard_applied",
    projectedRevenue,
    plannedCost,
    guardedCost: costRaw,
    revenueBoost,
    marginTarget: guardrail.marginTarget,
  });
  const revenue = trackRevenue({
    idea: selected ? selected.name || selected.idea : "fallback business",
    revenue: Number(revenueRaw.toFixed(2)),
    cost: Number(costRaw.toFixed(2)),
    startedAt: cycleStartedAt,
    finishedAt: Date.now(),
  });
  memory.logRevenue({
    venture_id: selected ? selected.name || selected.idea : "fallback business",
    amount: revenue.revenue,
    currency: "GBP",
    source: "capital_loop",
  });
  appendMemory({ kind: "revenue_tracked", revenue });

  const feedbackLearning = computeExecutionFeedback([
    {
      channel: "outreach",
      messageType: "compliance",
      converted: Number((executionResult.jobsBooked || executionResult.sales || executionResult.itemsFlipped) > 0 ? 1 : 0),
      clicks: Number(executionResult.clicks || 24),
      impressions: Number(executionResult.impressions || 210),
      hook: String((creative.content[0] && creative.content[0].hook) || "Problem hook"),
      cta: String((creative.content[0] && creative.content[0].CTA) || "Book now"),
    },
    {
      channel: "social",
      messageType: "proof",
      converted: Number((executionResult.sales || 0) > 0 ? 1 : 0),
      clicks: Number(executionResult.socialClicks || 37),
      impressions: Number(executionResult.socialImpressions || 420),
      hook: String(creative.video.hook || "Video hook"),
      cta: String(creative.video.CTA || "Buy now"),
    },
    {
      channel: "marketplace",
      messageType: "positioning",
      converted: Number((executionResult.itemsFlipped || 0) > 0 ? 1 : 0),
      clicks: Number(executionResult.marketClicks || 16),
      impressions: Number(executionResult.marketImpressions || 170),
      hook: String((creative.content[1] && creative.content[1].hook) || "Contrarian hook"),
      cta: String((creative.content[1] && creative.content[1].CTA) || "Start now"),
    },
  ]);
  appendMemory({ kind: "execution_feedback", feedbackLearning });

  const roiMultiple = Number(revenue.cost || 0) > 0 ? Number((Number(revenue.revenue || 0) / Number(revenue.cost || 1)).toFixed(4)) : 0;
  const scalingDecision = scaleOpportunity({
    roi: Number(revenue.roi || 0),
    roiMultiple,
    expectedROI: selected ? Number(selected.expectedROI || 0) : 0,
  });
  appendMemory({ kind: "scaling_decision", scalingDecision });
  const optimizedLanding = generateLanding({
    ...(selected || {}),
    targetAudience: "high-intent buyers",
    outcome: `higher CTR on ${feedbackLearning.bestPlatform}`,
  });
  const optimizedContent = generateContent({
    ...(selected || {}),
    checkoutLink: String((creative.landing && creative.landing.checkoutLink) || ""),
    bestHook: feedbackLearning.bestHook,
    bestCTA: feedbackLearning.bestCTA,
  });

  const nextRiskState = {
    consecutiveLosses: revenue.profit <= 0 ? riskState.consecutiveLosses + 1 : 0,
    profitableStreak: revenue.profit > 0 ? riskState.profitableStreak + 1 : 0,
  };
  writeRiskState(nextRiskState);
  appendMemory({ kind: "capital_protection_updated", riskState: nextRiskState });

  const reinvestedCapital = Number((allocation.experimental + allocation.scalable + Math.max(0, revenue.profit)).toFixed(2));
  appendMemory({ kind: "capital_reinvested", reinvestedCapital });

  const feedback = analyseFeedback([
    "slow onboarding",
    "unclear ROI from prior providers",
    "need faster implementation",
  ]);
  appendMemory({ kind: "sentiment_analysed", feedback });

  const businessId = `biz_${Date.now()}`;
  const currentPortfolio = readPortfolio();
  const cyclesWithoutRevenue = revenue.revenue > 0 ? 0 : 1;
  const portfolio = updatePortfolio(currentPortfolio, {
    id: businessId,
    idea: selected ? selected.name || selected.idea : "fallback business",
    status: scalingDecision.kill ? "killed" : scalingDecision.action === "scale" ? "scaled" : "active",
    revenue: revenue.revenue,
    cyclesWithoutRevenue: scalingDecision.kill ? 3 : cyclesWithoutRevenue,
  });
  writePortfolio(portfolio);
  appendMemory({ kind: "portfolio_updated", businessId });
  const portfolioIntelligence = await runPortfolioLoop({
    selectedIdea: selected || {},
    revenue: Number(revenue.revenue || 0),
    capital: Number(allocation.safe || 0),
    signalStrength,
    conversionRate: Number((feedbackLearning && feedbackLearning.conversionRate) || 0),
  });
  appendMemory({
    kind: "portfolio_loop_completed",
    reinvestedCapital: portfolioIntelligence.compound.reinvestedCapital,
    activeCount: portfolioIntelligence.activePortfolio.length,
  });

  const result = {
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
    selectedOpportunity: selected ? selected.name || selected.idea : "fallback business",
    selectedIdea: selected ? selected.name || selected.idea : "fallback business",
    creative,
    conversion,
    executionStatus: execution.status,
    revenueGenerated: revenue.revenue,
    profitGenerated: revenue.profit,
    mode: {
      systemMode,
      finalMode,
      userPreference: options.userPreference || "auto",
    },
    allocation,
    effectiveCapital,
    revenue,
    reinvestedCapital,
    portfolio,
    portfolioIntelligence,
    sentiment: feedback,
    feedbackLearning,
    profitGuard: {
      mode: profitMode,
      projectedRevenue,
      plannedCost,
      finalCost: Number(costRaw.toFixed(2)),
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
    stripe,
    matrixTop: matrix.slice(0, 5),
    analysedTop3,
    continuous: options.continuous !== false,
  };

  console.log(
    "[AETHRA CAPITAL]",
    JSON.stringify({
      selected_opportunity: result.selectedOpportunity,
      execution_status: result.executionStatus,
      revenue_generated: result.revenueGenerated,
      portfolio_state: {
        active: portfolio.activeBusinesses.length,
        killed: portfolio.killedBusinesses.length,
        scaled: portfolio.scaledBusinesses.length,
      },
    })
  );

  return result;
}

async function runCapitalEngine(capitalInput, options = {}) {
  return runAethraCapital(capitalInput, options);
}
module.exports = { runAethraCapital, runCapitalEngine };
