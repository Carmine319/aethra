import fs from "fs";
import path from "path";

type Risk = "low" | "medium" | "high" | "critical";

function readRiskMatrix() {
  const file = path.join(__dirname, "..", "config", "risk.matrix.json");
  if (!fs.existsSync(file)) return { high: [], critical: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function requiresApproval(actionType: string, risk: Risk = "low"): boolean {
  const matrix = readRiskMatrix();
  const high = Array.isArray(matrix.high) ? matrix.high : [];
  const critical = Array.isArray(matrix.critical) ? matrix.critical : [];
  if (risk === "high" || risk === "critical") return true;
  return high.includes(actionType) || critical.includes(actionType);
}

export function assertApproved(approved: boolean, reason: string) {
  if (!approved) {
    throw new Error(`Approval required: ${reason}`);
  }
}
