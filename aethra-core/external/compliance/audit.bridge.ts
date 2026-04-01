import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "external.audit.jsonl");

function ensure() {
  const dir = path.dirname(logFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "", "utf8");
}

/** Append-only external-domain audit trail (no overwrites). */
export function logExternalEvent(row: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(logFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}
