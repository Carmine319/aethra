import fs from "fs";
import path from "path";

type OrganismCycleRow = {
  ts: number;
  cycleId: string;
  opportunityId: string;
  capital: number;
  terminateCandidate: boolean;
  environmentScore: number;
  signalClass: string;
  anomalyScore: number;
  metabolismRevenue: number;
  conversionLift: number;
  energyEfficiency: number;
  selectedBehaviour: string;
};

const memoryFile = path.join(__dirname, "organism.cycles.jsonl");
const inMemoryRows: OrganismCycleRow[] = [];

function ensureMemoryFile() {
  const dir = path.dirname(memoryFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(memoryFile)) fs.writeFileSync(memoryFile, "", "utf8");
}

export function appendOrganismCycle(row: Omit<OrganismCycleRow, "ts">) {
  ensureMemoryFile();
  const entry: OrganismCycleRow = {
    ts: Date.now(),
    cycleId: String(row.cycleId || `org_${Date.now()}`),
    opportunityId: String(row.opportunityId || "unknown"),
    capital: Number(row.capital || 0),
    terminateCandidate: Boolean(row.terminateCandidate),
    environmentScore: Number(row.environmentScore || 0),
    signalClass: String(row.signalClass || "unknown"),
    anomalyScore: Number(row.anomalyScore || 0),
    metabolismRevenue: Number(row.metabolismRevenue || 0),
    conversionLift: Number(row.conversionLift || 0),
    energyEfficiency: Number(row.energyEfficiency || 0),
    selectedBehaviour: String(row.selectedBehaviour || "none"),
  };
  inMemoryRows.push(entry);
  fs.appendFileSync(memoryFile, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

export function getRecentOrganismCycles(limit = 30): OrganismCycleRow[] {
  const safeLimit = Math.max(1, Number(limit || 30));
  return inMemoryRows.slice(-safeLimit);
}

export function readRecentOrganismCycles(limit = 30): OrganismCycleRow[] {
  ensureMemoryFile();
  const safeLimit = Math.max(1, Number(limit || 30));
  const lines = fs.readFileSync(memoryFile, "utf8").split(/\r?\n/).filter((line) => line.trim());
  return lines.slice(-safeLimit).map((line) => {
    try {
      return JSON.parse(line) as OrganismCycleRow;
    } catch {
      return null;
    }
  }).filter(Boolean) as OrganismCycleRow[];
}
