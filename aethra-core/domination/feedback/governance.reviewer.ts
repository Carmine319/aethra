import { getRecentGovernanceAudit, readRecentGovernanceAudit } from "./governance.audit.memory";

type GovernanceDirective = {
  directive: "open" | "constrain" | "recovery_escalation";
  reason: string;
  confidence: number;
  suggestedCapitalFactor: number;
  cooldownCycles: number;
};

export function reviewGovernanceState(limit = 24): GovernanceDirective {
  const inMemory = getRecentGovernanceAudit(limit);
  const persisted = readRecentGovernanceAudit(limit);
  const rows = [...persisted, ...inMemory]
    .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
    .slice(-Math.max(5, limit));

  if (!rows.length) {
    return {
      directive: "open",
      reason: "insufficient audit history; defaulting to open deployment",
      confidence: 0.5,
      suggestedCapitalFactor: 1,
      cooldownCycles: 0,
    };
  }

  const recent = rows.slice(-6);
  const recoveryCount = recent.filter((row) => row.status === "recovery_only").length;
  const constrainedCount = recent.filter((row) => row.status === "constrained").length;
  const openCount = recent.filter((row) => row.status === "open").length;
  const avgVolatility = recent.reduce((sum, row) => sum + Number(row.volatility || 0), 0) / Math.max(1, recent.length);
  const avgScore = recent.reduce((sum, row) => sum + Number(row.rollingScore || 0), 0) / Math.max(1, recent.length);

  if (recoveryCount >= 3 || (avgScore < 0.42 && avgVolatility > 0.14)) {
    return {
      directive: "recovery_escalation",
      reason: "persistent recovery signals across recent governance audits",
      confidence: 0.88,
      suggestedCapitalFactor: 0.45,
      cooldownCycles: 3,
    };
  }

  if (constrainedCount >= 3 || (avgScore < 0.5 && avgVolatility > 0.1)) {
    return {
      directive: "constrain",
      reason: "dominance quality unstable; maintain constrained deployment",
      confidence: 0.76,
      suggestedCapitalFactor: 0.7,
      cooldownCycles: 2,
    };
  }

  if (openCount >= 4 && avgScore >= 0.58 && avgVolatility < 0.1) {
    return {
      directive: "open",
      reason: "sustained stable governance outcomes support full deployment",
      confidence: 0.82,
      suggestedCapitalFactor: 1,
      cooldownCycles: 0,
    };
  }

  return {
    directive: "constrain",
    reason: "mixed governance signals; keeping controlled deployment until clearer trend",
    confidence: 0.62,
    suggestedCapitalFactor: 0.8,
    cooldownCycles: 1,
  };
}
