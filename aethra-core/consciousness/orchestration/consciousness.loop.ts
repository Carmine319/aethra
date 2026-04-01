import { buildIdentity } from "../identity/identity.engine";
import { maintainIdentity } from "../identity/identity.stability";
import { mapCapabilities } from "../identity/capability.map";
import { evaluateRisk } from "../survival/risk.engine";
import { controlSurvivalExposure } from "../survival/exposure.controller";
import { protectDownside } from "../survival/downside.protection";
import { preserveCapital } from "../capital/preservation.engine";
import { allocateConsciousCapital } from "../capital/allocation.strategy";
import { computeCompoundingDirection } from "../capital/compounding.logic";
import { generateGoals } from "../goals/goal.generator";
import { prioritiseGoals } from "../goals/goal.prioritiser";
import { validateGoals } from "../goals/goal.validator";
import { mutateGoals } from "../goals/goal.mutation";
import { manageRedundancy } from "../resilience/redundancy.manager";
import { activateFallback } from "../resilience/failover.engine";
import { reduceDependencies } from "../resilience/dependency.reducer";
import { detectSystemAnomalies } from "../healing/anomaly.detector";
import { repairSystem } from "../healing/self.healing.engine";
import { planLongevity } from "../longevity/long.term.strategy";
import { assessHorizonStability } from "../longevity/horizon.stability";
import { detectDrift } from "../governance/drift.detector";
import { guardIntegrity } from "../governance/integrity.guard";
import { evaluateKillSwitch } from "../governance/kill.switch";

export async function runConsciousnessLoop(input: {
  capital: number;
  dependencyIndex?: number;
  volatility?: number;
  performanceDrop?: number;
  errorRate?: number;
}) {
  const identity = buildIdentity({});
  const identityStability = maintainIdentity(identity, [{ pressure: Number(input.volatility || 0.45) }]);
  const capabilityMap = mapCapabilities(identity.capabilities as string[]);

  const risk = evaluateRisk({
    exposure: Number(input.volatility || 0.45),
    dependency: Number(input.dependencyIndex || 0.4),
    volatility: Number(input.volatility || 0.45),
  });
  const exposure = controlSurvivalExposure(Number(input.capital || 0), risk.riskScore);
  const downside = protectDownside(Number(input.capital || 0), risk.riskScore);
  const preservation = preserveCapital(Number(input.capital || 0), downside.reserveCapital);
  const allocation = allocateConsciousCapital(preservation.spendableCapital, risk.riskScore);

  const baseGoals = generateGoals({ capital: Number(input.capital || 0), riskScore: risk.riskScore });
  const mutatedGoals = mutateGoals(baseGoals, risk.riskScore);
  const prioritisedGoals = prioritiseGoals(mutatedGoals);
  const validatedGoals = validateGoals(prioritisedGoals);

  const redundancy = manageRedundancy(["instinct", "organism", "domination", "portfolio"]);
  const dependencies = reduceDependencies([{ name: "single-channel", criticality: Number(input.dependencyIndex || 0.4) }]);
  const anomalies = detectSystemAnomalies({
    performanceDrop: Number(input.performanceDrop || 0.2),
    errorRate: Number(input.errorRate || 0.18),
    latency: Number(input.volatility || 0.45),
  });
  const healing = repairSystem({ anomalyScore: anomalies.anomalyScore, dependencyIndex: dependencies.dependencyIndex });
  const failover = anomalies.needsHealing ? activateFallback({ failedComponents: ["primary-execution"] }) : activateFallback({ failedComponents: [] });

  const drift = detectDrift({
    goalAlignment: 0.78,
    capitalEfficiency: Number((1 - risk.riskScore * 0.4).toFixed(4)),
    strategicCoherence: Number(identityStability.stabilityScore || 0.7),
  });
  const integrity = guardIntegrity({
    riskScore: risk.riskScore,
    driftScore: drift.driftScore,
    anomalyScore: anomalies.anomalyScore,
  });
  const killSwitch = evaluateKillSwitch({
    riskScore: risk.riskScore,
    survivableCapital: preservation.survivableCapital,
    integrityScore: integrity.integrityScore,
  });

  const longevity = planLongevity({
    reserveRatio: Number((preservation.survivableCapital / Math.max(1, Number(input.capital || 1))).toFixed(4)),
    resilience: Number((healing.restoredPerformance || 0.7)),
    dependencyIndex: dependencies.dependencyIndex,
  });
  const horizon = assessHorizonStability({
    volatility: Number(input.volatility || 0.45),
    longevityScore: longevity.longevityScore,
  });
  const compounding = computeCompoundingDirection({
    roi: 1.1,
    reserveRatio: Number((preservation.survivableCapital / Math.max(1, Number(input.capital || 1))).toFixed(4)),
    resilience: Number(horizon.horizonStability || 0.6),
  });

  return {
    flow: [
      "stabilise identity",
      "generate + prioritise goals",
      "evaluate survival risk",
      "preserve capital",
      "allocate resources",
      "monitor system health",
      "detect anomalies",
      "self-heal if needed",
      "detect drift",
      "adjust direction",
      "update long-term strategy",
      "repeat continuously",
    ],
    identity: { identity, identityStability, capabilityMap },
    goals: { baseGoals, mutatedGoals, prioritisedGoals, validatedGoals },
    survival: { risk, exposure, downside },
    capital: { preservation, allocation, compounding },
    resilience: { redundancy, dependencies, failover },
    healing: { anomalies, healing },
    governance: { drift, integrity, killSwitch },
    longevity: { longevity, horizon },
    continuityMode: killSwitch.trigger ? "preservation" : "adaptive-compounding",
  };
}
