import { getRecentDominanceHistory, readRecentDominanceHistory } from "./dominance.memory";

type DominanceTrend = {
  historyCount: number;
  rollingScore: number;
  delta: number;
  volatility: number;
  trendState: "accelerating" | "stable" | "fragile" | "reversing";
};

type CompoundingPolicy = {
  capitalIntensityMultiplier: number;
  repetitionMultiplier: number;
  speedPressure: number;
  competitorPressure: number;
  explorationBias: number;
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getDominanceTrend(limit = 40): DominanceTrend {
  const inMemory = getRecentDominanceHistory(limit);
  const persisted = readRecentDominanceHistory(limit);
  const merged = [...persisted, ...inMemory]
    .filter((row) => row && Number.isFinite(Number(row.dominanceScore)))
    .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
    .slice(-Math.max(4, limit));

  if (!merged.length) {
    return {
      historyCount: 0,
      rollingScore: 0.5,
      delta: 0,
      volatility: 0,
      trendState: "stable",
    };
  }

  const scores = merged.map((row) => Number(row.dominanceScore || 0));
  const recentWindow = scores.slice(-Math.max(3, Math.floor(scores.length / 3)));
  const baselineWindow = scores.slice(0, Math.max(1, scores.length - recentWindow.length));
  const rollingScore = Number(average(recentWindow).toFixed(4));
  const baseline = Number(average(baselineWindow).toFixed(4));
  const delta = Number((rollingScore - baseline).toFixed(4));
  const variance = average(scores.map((score) => Math.pow(score - average(scores), 2)));
  const volatility = Number(Math.sqrt(Math.max(0, variance)).toFixed(4));

  let trendState: DominanceTrend["trendState"] = "stable";
  if (delta >= 0.06) trendState = "accelerating";
  else if (delta <= -0.08) trendState = "reversing";
  else if (volatility >= 0.12 || rollingScore < 0.45) trendState = "fragile";

  return {
    historyCount: merged.length,
    rollingScore,
    delta,
    volatility,
    trendState,
  };
}

export function buildCompoundingPolicy(trend: DominanceTrend): CompoundingPolicy {
  if (trend.trendState === "accelerating") {
    return {
      capitalIntensityMultiplier: 1.2,
      repetitionMultiplier: 1.05,
      speedPressure: 1.15,
      competitorPressure: 1.1,
      explorationBias: 0.75,
    };
  }
  if (trend.trendState === "reversing") {
    return {
      capitalIntensityMultiplier: 0.85,
      repetitionMultiplier: 1.3,
      speedPressure: 1.35,
      competitorPressure: 1.25,
      explorationBias: 1.25,
    };
  }
  if (trend.trendState === "fragile") {
    return {
      capitalIntensityMultiplier: 0.95,
      repetitionMultiplier: 1.2,
      speedPressure: 1.2,
      competitorPressure: 1.15,
      explorationBias: 1.1,
    };
  }
  return {
    capitalIntensityMultiplier: 1,
    repetitionMultiplier: 1.1,
    speedPressure: 1,
    competitorPressure: 1,
    explorationBias: 1,
  };
}
