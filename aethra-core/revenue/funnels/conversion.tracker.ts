import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "..", "memory", "conversions.log.jsonl");

function appendLine(row: Record<string, unknown>) {
  const dir = path.dirname(logFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(logFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

let conversions = 0;

export function trackConversion(meta?: Record<string, unknown>) {
  conversions++;
  appendLine({ event: "conversion", count: conversions, ...meta });
}

export function getConversionCount(): number {
  return conversions;
}

export function getConversionRate(total: number): number {
  if (!total || total <= 0) return 0;
  return conversions / total;
}

export function resetConversionCounter() {
  conversions = 0;
}
