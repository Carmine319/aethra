import fs from "fs";
import path from "path";

type GovernanceAuditRow = {
  ts: number;
  cycleId: string;
  status: "open" | "constrained" | "recovery_only";
  allowScaling: boolean;
  maxDeploymentCapital: number;
  reason: string;
  trendState: string;
  rollingScore: number;
  volatility: number;
};

const auditFile = path.join(__dirname, "governance.audit.jsonl");
const inMemoryAuditRows: GovernanceAuditRow[] = [];

function ensureAuditFile() {
  const dir = path.dirname(auditFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(auditFile)) fs.writeFileSync(auditFile, "", "utf8");
}

export function appendGovernanceAudit(row: Omit<GovernanceAuditRow, "ts">) {
  ensureAuditFile();
  const entry: GovernanceAuditRow = {
    ts: Date.now(),
    cycleId: String(row.cycleId || "unknown-cycle"),
    status: row.status,
    allowScaling: Boolean(row.allowScaling),
    maxDeploymentCapital: Number(row.maxDeploymentCapital || 0),
    reason: String(row.reason || "no-reason"),
    trendState: String(row.trendState || "stable"),
    rollingScore: Number(row.rollingScore || 0),
    volatility: Number(row.volatility || 0),
  };
  inMemoryAuditRows.push(entry);
  fs.appendFileSync(auditFile, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

export function getRecentGovernanceAudit(limit = 40): GovernanceAuditRow[] {
  const safeLimit = Math.max(1, Number(limit || 40));
  return inMemoryAuditRows.slice(-safeLimit);
}

export function readRecentGovernanceAudit(limit = 40): GovernanceAuditRow[] {
  ensureAuditFile();
  const safeLimit = Math.max(1, Number(limit || 40));
  const lines = fs.readFileSync(auditFile, "utf8").split(/\r?\n/).filter((line) => line.trim());
  return lines.slice(-safeLimit).map((line) => {
    try {
      return JSON.parse(line) as GovernanceAuditRow;
    } catch {
      return null;
    }
  }).filter(Boolean) as GovernanceAuditRow[];
}
