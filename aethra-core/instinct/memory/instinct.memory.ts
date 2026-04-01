import fs from "fs";
import path from "path";

type InstinctCycleRow = {
  ts: number;
  cycleId: string;
  capital: number;
  weakSignalCount: number;
  gradientShiftCount: number;
  hypothesisCount: number;
  probeCount: number;
  passedCount: number;
  confidence: number;
  errorRate: number;
  exploration: number;
  exploitation: number;
  entryMode: string;
};

const memoryFile = path.join(__dirname, "instinct.cycles.jsonl");
const inMemoryRows: InstinctCycleRow[] = [];

function ensureFile() {
  const dir = path.dirname(memoryFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(memoryFile)) fs.writeFileSync(memoryFile, "", "utf8");
}

export function appendInstinctCycle(row: Omit<InstinctCycleRow, "ts">) {
  ensureFile();
  const entry: InstinctCycleRow = {
    ts: Date.now(),
    cycleId: String(row.cycleId || `instinct_${Date.now()}`),
    capital: Number(row.capital || 0),
    weakSignalCount: Number(row.weakSignalCount || 0),
    gradientShiftCount: Number(row.gradientShiftCount || 0),
    hypothesisCount: Number(row.hypothesisCount || 0),
    probeCount: Number(row.probeCount || 0),
    passedCount: Number(row.passedCount || 0),
    confidence: Number(row.confidence || 0),
    errorRate: Number(row.errorRate || 0),
    exploration: Number(row.exploration || 0),
    exploitation: Number(row.exploitation || 0),
    entryMode: String(row.entryMode || "observe-and-probe"),
  };
  inMemoryRows.push(entry);
  fs.appendFileSync(memoryFile, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

export function getRecentInstinctCycles(limit = 30): InstinctCycleRow[] {
  const safeLimit = Math.max(1, Number(limit || 30));
  return inMemoryRows.slice(-safeLimit);
}

export function readRecentInstinctCycles(limit = 30): InstinctCycleRow[] {
  ensureFile();
  const safeLimit = Math.max(1, Number(limit || 30));
  const lines = fs.readFileSync(memoryFile, "utf8").split(/\r?\n/).filter((line) => line.trim());
  return lines.slice(-safeLimit).map((line) => {
    try {
      return JSON.parse(line) as InstinctCycleRow;
    } catch {
      return null;
    }
  }).filter(Boolean) as InstinctCycleRow[];
}
