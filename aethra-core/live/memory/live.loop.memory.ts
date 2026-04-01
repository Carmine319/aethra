import fs from "fs";
import path from "path";

type LiveLoopRow = {
  ts: number;
  cycleId: string;
  loopId: string;
  roi: number;
  revenue: number;
  active: boolean;
  killed: boolean;
  scaled: boolean;
  recovered: boolean;
  fallbackSwitched: boolean;
};

const memoryFile = path.join(__dirname, "live.loops.jsonl");
const inMemoryRows: LiveLoopRow[] = [];

function ensureFile() {
  const dir = path.dirname(memoryFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(memoryFile)) fs.writeFileSync(memoryFile, "", "utf8");
}

export function appendLiveLoops(rows: Array<Omit<LiveLoopRow, "ts">>) {
  ensureFile();
  const entries = rows.map((row) => ({
    ts: Date.now(),
    cycleId: String(row.cycleId || `live_${Date.now()}`),
    loopId: String(row.loopId || "loop_unknown"),
    roi: Number(row.roi || 0),
    revenue: Number(row.revenue || 0),
    active: Boolean(row.active),
    killed: Boolean(row.killed),
    scaled: Boolean(row.scaled),
    recovered: Boolean(row.recovered),
    fallbackSwitched: Boolean(row.fallbackSwitched),
  }));
  for (const entry of entries) {
    inMemoryRows.push(entry);
    fs.appendFileSync(memoryFile, JSON.stringify(entry) + "\n", "utf8");
  }
  return entries;
}

export function getRecentLiveLoops(limit = 40): LiveLoopRow[] {
  return inMemoryRows.slice(-Math.max(1, Number(limit || 40)));
}

export function readRecentLiveLoops(limit = 40): LiveLoopRow[] {
  ensureFile();
  const safeLimit = Math.max(1, Number(limit || 40));
  const lines = fs.readFileSync(memoryFile, "utf8").split(/\r?\n/).filter((line) => line.trim());
  return lines.slice(-safeLimit).map((line) => {
    try {
      return JSON.parse(line) as LiveLoopRow;
    } catch {
      return null;
    }
  }).filter(Boolean) as LiveLoopRow[];
}
