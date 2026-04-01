import fs from "fs";
import path from "path";
import crypto from "crypto";

const auditFile = path.join(__dirname, "..", "logs", "audit.log.jsonl");

function ensurePath() {
  const dir = path.dirname(auditFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(auditFile)) fs.writeFileSync(auditFile, "", "utf8");
}

function getLastHash() {
  ensurePath();
  const rows = fs
    .readFileSync(auditFile, "utf8")
    .split(/\r?\n/)
    .filter((x) => x.trim());
  if (!rows.length) return "genesis";
  try {
    const last = JSON.parse(rows[rows.length - 1]);
    return String(last.hash || "genesis");
  } catch {
    return "genesis";
  }
}

export function logEvent(event: any) {
  ensurePath();
  const payload = { ts: Date.now(), ...event };
  const prev_hash = getLastHash();
  const hash = crypto
    .createHash("sha256")
    .update(`${prev_hash}|${JSON.stringify(payload)}`, "utf8")
    .digest("hex");
  fs.appendFileSync(auditFile, JSON.stringify({ ...payload, prev_hash, hash }) + "\n", "utf8");
  return { prev_hash, hash };
}

export function readEvents(limit = 200): any[] {
  ensurePath();
  const rows = fs
    .readFileSync(auditFile, "utf8")
    .split(/\r?\n/)
    .filter((x) => x.trim())
    .slice(-Math.max(1, Number(limit || 200)));
  return rows.map((line) => JSON.parse(line));
}
