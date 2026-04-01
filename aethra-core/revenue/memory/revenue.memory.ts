import fs from "fs";
import path from "path";

const perfFile = path.join(__dirname, "performance.log.jsonl");

function ensureFile() {
  const dir = path.dirname(perfFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(perfFile)) fs.writeFileSync(perfFile, "", "utf8");
}

/** Append-only performance ledger (no overwrites). */
export function appendPerformanceLog(row: Record<string, unknown>) {
  ensureFile();
  fs.appendFileSync(perfFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

const inMemory: Array<{ revenue: number; [k: string]: unknown }> = [];

export function storeResult(result: { revenue: number; [k: string]: unknown }) {
  inMemory.push(result);
  appendPerformanceLog({ event: "store_result", ...result });
}

export function getBestPerformers(limit = 20) {
  ensureFile();
  const lines = fs
    .readFileSync(perfFile, "utf8")
    .split(/\r?\n/)
    .filter((x) => x.trim())
    .map((line) => {
      try {
        return JSON.parse(line) as { revenue?: number };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ revenue?: number }>;

  const merged = [...inMemory, ...lines.map((l) => ({ revenue: Number(l.revenue || 0), ...l }))];
  return merged.sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)).slice(0, limit);
}
