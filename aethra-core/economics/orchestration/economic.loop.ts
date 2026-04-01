import { ingestCapital } from "../capital/intake.engine";
import { manageWallet } from "../capital/wallet.manager";
import { allocateEconomicCapital } from "../capital/allocation.engine";
import { measureCapitalEfficiency } from "../capital/capital.efficiency";
import { measureVelocity } from "../capital/capital.velocity";
import { validateEconomicOpportunity } from "../opportunity/economic.validator";
import { estimateMargin } from "../opportunity/margin.estimator";
import { analyseFriction } from "../opportunity/friction.analyser";
import { detectAsymmetry } from "../opportunity/asymmetry.detector";
import { getChannelRegistry } from "../channels/channel.registry";
import { routeChannels } from "../channels/channel.router";
import { assessChannelHealth } from "../channels/channel.health";
import { findChannelArbitrage } from "../channels/channel.arbitrage";
import { mapAttentionLandscape } from "../channels/attention.map";
import { increasePricingPower } from "../positioning/pricing.power";
import { leveragePerception } from "../positioning/perception.leverage";
import { shapeDemand } from "../positioning/demand.shaping";
import { executePricing } from "../revenue/pricing.executor";
import { accelerateRevenue } from "../revenue/revenue.accelerator";
import { runRevenueLoop } from "../revenue/loop.engine";
import { mapMonetisation } from "../revenue/monetisation.map";
import { captureValue } from "../revenue/value.capture";
import { detectBottlenecks } from "../optimisation/bottleneck.detector";
import { removeConstraints } from "../optimisation/constraint.remover";
import { compactEfficiency } from "../optimisation/efficiency.compactor";
import { maximiseProfit } from "../optimisation/profit.maximiser";
import { trackEconomicRevenue } from "../cashflow/revenue.tracker";
import { calculateEconomicProfit } from "../cashflow/profit.calculator";
import { trackCapitalFlow } from "../cashflow/capital.flow";
import { reinvestProfit } from "../reinvestment/reinvest.engine";
import { triggerScaling } from "../reinvestment/scaling.trigger";
import { computeCompoundingCurve } from "../reinvestment/compounding.curve";
import { accumulateAdvantage } from "../reinvestment/dominance.accumulator";

export async function runEconomicLoop(input: {
  capital: number;
  opportunity: Record<string, unknown>;
  conversionRate: number;
  demandSignal: number;
}) {
  const intake = ingestCapital(input.capital);
  const wallet = manageWallet(intake.availableCapital);
  const validation = validateEconomicOpportunity({
    demand: input.demandSignal,
    valueClarity: 0.62,
    feasibility: 0.64,
    marginPotential: 0.58,
    speedToRevenue: 0.61,
    scalability: 0.66,
    positioningLeverage: 0.63,
  });
  const asymmetry = detectAsymmetry({ upside: 0.85, downside: 0.3, validationSpeed: 0.72 });
  const allocation = allocateEconomicCapital(intake.deployable, Math.min(1, asymmetry.asymmetryRatio / 3));
  const friction = analyseFriction({ steps: 4, latencyMs: 1300, dropoffRate: 0.24 });
  const channels = getChannelRegistry();
  const routed = routeChannels(channels);
  const attention = mapAttentionLandscape(channels);
  const channelHealth = assessChannelHealth(channels);
  const arbitrage = findChannelArbitrage(channels);
  const pricingPower = increasePricingPower({ proofStrength: 0.68, differentiation: 0.61, trust: 0.73 });
  const demand = shapeDemand({ relevance: 0.7, urgency: 0.58, proof: 0.67 });
  const perception = leveragePerception({ clarity: 0.69, authority: 0.64, repetition: 0.62 });
  const pricing = executePricing(Number(input.opportunity.basePrice || 199), pricingPower.pricingPower);
  const revenueAcceleration = accelerateRevenue({ conversionRate: input.conversionRate, delayHours: 6 });
  const revenueLoop = runRevenueLoop({
    traffic: 1200,
    conversionRate: revenueAcceleration.acceleratedConversion,
    avgOrderValue: pricing.finalPrice,
  });
  const valueCapture = captureValue({ revenue: revenueLoop.revenue, leakageRate: 0.12 });
  const margin = estimateMargin(valueCapture.captured, allocation.growth * 0.35, allocation.protection * 0.1);
  const efficiency = measureCapitalEfficiency({ revenue: valueCapture.captured, spend: allocation.growth + allocation.probes });
  const velocity = measureVelocity(intake.availableCapital, 24, valueCapture.captured);
  const bottlenecks = detectBottlenecks({
    frictionScore: friction.frictionScore,
    conversionRate: revenueAcceleration.acceleratedConversion,
    delayHours: 6 - revenueAcceleration.delayReduction,
  });
  const constraints = removeConstraints(bottlenecks);
  const compactor = compactEfficiency({ manualSteps: 5, toolCount: 4 });
  const optimisedProfit = maximiseProfit({ revenue: valueCapture.captured, cost: allocation.growth + allocation.probes });
  const cashRevenue = trackEconomicRevenue(valueCapture.captured, `economic_${Date.now()}`);
  const cashProfit = calculateEconomicProfit(valueCapture.captured, allocation.growth + allocation.probes);
  const capitalFlow = trackCapitalFlow({
    openingCapital: intake.availableCapital,
    deployed: allocation.growth + allocation.probes,
    recovered: valueCapture.captured,
  });
  const reinvestment = reinvestProfit(cashProfit.profit, Number(input.opportunity.confidenceScore || 0.6) / 10);
  const scaling = triggerScaling({
    roi: cashProfit.roi,
    velocity: velocity.compoundingSpeed,
    asymmetryPreferred: asymmetry.preferred,
  });
  const compoundingCurve = computeCompoundingCurve([{ profit: cashProfit.profit }]);
  const dominanceAccumulator = accumulateAdvantage([{
    roi: cashProfit.roi,
    speed: velocity.compoundingSpeed,
    positioning: pricingPower.pricingPower + demand.demandLift + perception.leverageScore,
  }]);

  return {
    flow: [
      "ingest capital",
      "scan + validate opportunities",
      "detect asymmetry",
      "estimate margin + friction",
      "map attention landscape",
      "allocate capital dynamically",
      "deploy via optimal channel",
      "accelerate revenue loop",
      "capture maximum value",
      "track profit + capital flow",
      "detect bottlenecks",
      "optimise system continuously",
      "reinforce positioning power",
      "reinvest into dominant systems",
      "update compounding + dominance curves",
      "repeat continuously",
    ],
    capital: { intake, wallet, allocation, efficiency, velocity },
    opportunity: { validation, asymmetry, friction, margin },
    channels: { routed, attention, channelHealth, arbitrage },
    positioning: { pricingPower, demand, perception, pricing },
    revenue: { revenueAcceleration, revenueLoop, valueCapture, monetisation: mapMonetisation() },
    optimisation: { bottlenecks, constraints, compactor, optimisedProfit },
    cashflow: { cashRevenue, cashProfit, capitalFlow },
    reinvestment: { reinvestment, scaling, compoundingCurve, dominanceAccumulator },
  };
}
