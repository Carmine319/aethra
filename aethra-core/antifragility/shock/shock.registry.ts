import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "..", "learning", "shock.log.jsonl");

function ensure() {
  const dir = path.dirname(logFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "", "utf8");
}

export function registerShock(entry: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(logFile, JSON.stringify({ ts: Date.now(), ...entry }) + "\n", "utf8");
}
