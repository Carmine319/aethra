import fs from "fs";
import path from "path";

type DominanceHistoryRow = {
  opportunityId: string;
  dominanceScore: number;
  trend: string;
  stability: string;
  revenue: number;
  adoptionRate: number;
  ts: number;
};

const dominanceMemoryFile = path.join(__dirname, "dominance.history.jsonl");
const inMemoryHistory: DominanceHistoryRow[] = [];

function ensureDominanceMemoryFile() {
  const dir = path.dirname(dominanceMemoryFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dominanceMemoryFile)) fs.writeFileSync(dominanceMemoryFile, "", "utf8");
}

export function appendDominanceHistory(row: Omit<DominanceHistoryRow, "ts">) {
  ensureDominanceMemoryFile();
  const entry: DominanceHistoryRow = {
    ts: Date.now(),
    opportunityId: String(row.opportunityId || "unknown"),
    dominanceScore: Number(row.dominanceScore || 0),
    trend: String(row.trend || "forming"),
    stability: String(row.stability || "volatile"),
    revenue: Number(row.revenue || 0),
    adoptionRate: Number(row.adoptionRate || 0),
  };
  inMemoryHistory.push(entry);
  fs.appendFileSync(dominanceMemoryFile, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

export function getRecentDominanceHistory(limit = 30): DominanceHistoryRow[] {
  const safeLimit = Math.max(1, Number(limit || 30));
  return inMemoryHistory.slice(-safeLimit);
}

export function readRecentDominanceHistory(limit = 30): DominanceHistoryRow[] {
  ensureDominanceMemoryFile();
  const safeLimit = Math.max(1, Number(limit || 30));
  const lines = fs.readFileSync(dominanceMemoryFile, "utf8").split(/\r?\n/).filter((line) => line.trim());
  const recent = lines.slice(-safeLimit).map((line) => {
    try {
      return JSON.parse(line) as DominanceHistoryRow;
    } catch {
      return null;
    }
  }).filter(Boolean) as DominanceHistoryRow[];
  return recent;
}
