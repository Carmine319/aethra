import { runSystemTests } from "../testing/system.test";
import { validateEconomics } from "../testing/economic.test";
import { testChannels } from "../testing/channel.test";
import { monitorSystem } from "../monitoring/health.monitor";
import { detectAnomalies } from "../monitoring/anomaly.detector";
import { validateRevenueFlow } from "../monitoring/revenue.validator";
import { traceError } from "../debugging/error.tracer";
import { analyseFailure } from "../debugging/failure.analyser";
import { activateFallback } from "../recovery/fallback.engine";
import { recoverSystem } from "../recovery/auto.recovery";

export async function runReliabilityLoop(input: {
  bookedRevenue: number;
  settledRevenue: number;
  reportedProfit: number;
  calculatedProfit: number;
  channels: Array<{ name: string; postingOk: boolean; deliveryOk: boolean; engagement: number }>;
  errorRate: number;
  executionSuccess: number;
  latencyMs: number;
  revenueFlow: number;
  revenueDrop: number;
  conversionDrop: number;
  behaviourDrift: number;
}) {
  const systemTests = runSystemTests();
  const economics = validateEconomics({
    revenueReceived: input.settledRevenue,
    paymentSuccessRate: 0.98,
    reportedProfit: input.reportedProfit,
    calculatedProfit: input.calculatedProfit,
  });
  const channels = testChannels(input.channels);
  const health = monitorSystem({
    errorRate: input.errorRate,
    executionSuccess: input.executionSuccess,
    latencyMs: input.latencyMs,
    revenueFlow: input.revenueFlow,
  });
  const anomalies = detectAnomalies({
    revenueDrop: input.revenueDrop,
    conversionDrop: input.conversionDrop,
    behaviourDrift: input.behaviourDrift,
  });
  const revenueValidation = validateRevenueFlow({
    bookedRevenue: input.bookedRevenue,
    settledRevenue: input.settledRevenue,
  });

  const hasFailure = !systemTests.passed || !economics.passed || channels.deadChannels.length > 0 || anomalies.detected || !revenueValidation.valid;
  const traced = hasFailure
    ? traceError({ message: "reliability anomaly detected", module: "reliability.loop" })
    : null;
  const failure = hasFailure
    ? analyseFailure({
      anomalyScore: anomalies.anomalyScore,
      healthScore: health.healthScore,
      revenueDelta: revenueValidation.delta,
    })
    : null;
  const fallback = hasFailure
    ? activateFallback({
      deadChannels: channels.deadChannels,
      riskMode: failure?.fixPriority || "normal",
    })
    : null;
  const recovery = hasFailure && failure && fallback ? recoverSystem(failure, fallback) : null;

  return {
    flow: [
      "run system tests",
      "validate economics",
      "test channels",
      "monitor health",
      "detect anomalies",
      "trace errors",
      "analyse failures",
      "recover automatically",
      "log everything",
      "repeat continuously",
    ],
    gate: {
      canExecute: systemTests.gateExecution && economics.passed,
      reason: systemTests.gateExecution && economics.passed ? "validated" : "blocked-by-reliability",
    },
    testing: { systemTests, economics, channels },
    monitoring: { health, anomalies, revenueValidation },
    debugging: { traced, failure },
    recovery: { fallback, recovery },
  };
}
