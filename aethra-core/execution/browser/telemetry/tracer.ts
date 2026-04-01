import fs from "fs";
import path from "path";
import crypto from "crypto";

const logsDir = path.join(__dirname, "..", "logs");
const activityFile = path.join(logsDir, "activity.log.jsonl");
const auditFile = path.join(logsDir, "audit.log.jsonl");

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

function appendJsonl(file: string, row: Record<string, unknown>) {
  ensureLogsDir();
  fs.appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
}

function hashChain(prevHash: string, payload: unknown): string {
  return crypto
    .createHash("sha256")
    .update(`${prevHash}|${JSON.stringify(payload)}`, "utf8")
    .digest("hex");
}

function getLastAuditHash(): string {
  try {
    if (!fs.existsSync(auditFile)) return "genesis";
    const lines = fs
      .readFileSync(auditFile, "utf8")
      .split(/\r?\n/)
      .filter((x) => x.trim());
    if (!lines.length) return "genesis";
    const last = JSON.parse(lines[lines.length - 1]);
    return String(last.hash || "genesis");
  } catch {
    return "genesis";
  }
}

export function trace(event: string, data: any) {
  const row = { ts: Date.now(), event, data };
  console.log(`[TRACE] ${event}`, data);
  appendJsonl(activityFile, row);
}

export function audit(event: string, data: any) {
  const base = { ts: Date.now(), event, data };
  const prev = getLastAuditHash();
  const hash = hashChain(prev, base);
  appendJsonl(auditFile, { ...base, prev_hash: prev, hash });
}
