import { getRecentOrganismCycles, readRecentOrganismCycles } from "../memory/organism.memory";

type OrganismDirective = {
  mode: "normal" | "recovery_mutation" | "termination_watch";
  reason: string;
  confidence: number;
  mutationPressure: number;
  capitalFactor: number;
};

export function reviewOrganismState(limit = 24): OrganismDirective {
  const inMemory = getRecentOrganismCycles(limit);
  const persisted = readRecentOrganismCycles(limit);
  const rows = [...persisted, ...inMemory]
    .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
    .slice(-Math.max(6, limit));

  if (!rows.length) {
    return {
      mode: "normal",
      reason: "insufficient organism history",
      confidence: 0.5,
      mutationPressure: 1,
      capitalFactor: 1,
    };
  }

  const recent = rows.slice(-6);
  const avgAnomaly = recent.reduce((sum, row) => sum + Number(row.anomalyScore || 0), 0) / Math.max(1, recent.length);
  const avgEnergy = recent.reduce((sum, row) => sum + Number(row.energyEfficiency || 0), 0) / Math.max(1, recent.length);
  const terminateFlags = recent.filter((row) => Boolean(row.terminateCandidate)).length;
  const revenueSlope = Number(recent[recent.length - 1]?.metabolismRevenue || 0) - Number(recent[0]?.metabolismRevenue || 0);

  if (terminateFlags >= 3 || (avgEnergy < 0.75 && avgAnomaly > 0.95)) {
    return {
      mode: "termination_watch",
      reason: "energy decay and elevated anomaly persistence detected",
      confidence: 0.9,
      mutationPressure: 1.4,
      capitalFactor: 0.55,
    };
  }

  if (avgAnomaly > 0.8 || avgEnergy < 1 || revenueSlope < 0) {
    return {
      mode: "recovery_mutation",
      reason: "organism drift detected; proactive mutation recommended",
      confidence: 0.78,
      mutationPressure: 1.25,
      capitalFactor: 0.8,
    };
  }

  return {
    mode: "normal",
    reason: "organism stable and compounding",
    confidence: 0.82,
    mutationPressure: 1,
    capitalFactor: 1,
  };
}
