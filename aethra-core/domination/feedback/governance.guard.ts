type GovernanceInput = {
  dominanceTrend: {
    rollingScore: number;
    delta: number;
    volatility: number;
    trendState: "accelerating" | "stable" | "fragile" | "reversing";
  };
  compoundingPolicy: {
    capitalIntensityMultiplier: number;
    repetitionMultiplier: number;
    speedPressure: number;
    competitorPressure: number;
    explorationBias: number;
  };
  baseCapital: number;
};

type GovernanceGuardrail = {
  status: "open" | "constrained" | "recovery_only";
  allowScaling: boolean;
  maxDeploymentCapital: number;
  reason: string;
  recoveryPlaybook: string[];
  adjustedPolicy: {
    capitalIntensityMultiplier: number;
    repetitionMultiplier: number;
    speedPressure: number;
    competitorPressure: number;
    explorationBias: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function enforceDominanceGuardrails(input: GovernanceInput): GovernanceGuardrail {
  const { dominanceTrend, compoundingPolicy, baseCapital } = input;
  const lowScore = dominanceTrend.rollingScore < 0.45;
  const highVolatility = dominanceTrend.volatility >= 0.14;
  const reversing = dominanceTrend.trendState === "reversing";
  const fragile = dominanceTrend.trendState === "fragile";

  const recoveryPlaybook = [
    "tighten category criteria around measurable ROI",
    "increase narrative repetition on highest-intent channels",
    "run short-cycle conversion tests before scaling",
    "reduce capital risk until dominance trend stabilises",
  ];

  if (reversing || (lowScore && highVolatility)) {
    return {
      status: "recovery_only",
      allowScaling: false,
      maxDeploymentCapital: Number((baseCapital * 0.35).toFixed(2)),
      reason: "dominance trend reversing under elevated volatility",
      recoveryPlaybook,
      adjustedPolicy: {
        capitalIntensityMultiplier: clamp(compoundingPolicy.capitalIntensityMultiplier * 0.75, 0.55, 1),
        repetitionMultiplier: clamp(compoundingPolicy.repetitionMultiplier * 1.25, 1, 1.8),
        speedPressure: clamp(compoundingPolicy.speedPressure * 1.2, 1, 1.8),
        competitorPressure: clamp(compoundingPolicy.competitorPressure * 1.2, 1, 1.8),
        explorationBias: clamp(compoundingPolicy.explorationBias * 1.3, 1, 1.9),
      },
    };
  }

  if (fragile || lowScore || highVolatility) {
    return {
      status: "constrained",
      allowScaling: false,
      maxDeploymentCapital: Number((baseCapital * 0.6).toFixed(2)),
      reason: "dominance trend fragile; constrain risk and reinforce signal quality",
      recoveryPlaybook,
      adjustedPolicy: {
        capitalIntensityMultiplier: clamp(compoundingPolicy.capitalIntensityMultiplier * 0.9, 0.7, 1.1),
        repetitionMultiplier: clamp(compoundingPolicy.repetitionMultiplier * 1.15, 1, 1.6),
        speedPressure: clamp(compoundingPolicy.speedPressure * 1.1, 1, 1.6),
        competitorPressure: clamp(compoundingPolicy.competitorPressure * 1.1, 1, 1.6),
        explorationBias: clamp(compoundingPolicy.explorationBias * 1.15, 0.95, 1.7),
      },
    };
  }

  return {
    status: "open",
    allowScaling: true,
    maxDeploymentCapital: Number(baseCapital.toFixed(2)),
    reason: "dominance trend stable enough for full deployment",
    recoveryPlaybook,
    adjustedPolicy: compoundingPolicy,
  };
}
