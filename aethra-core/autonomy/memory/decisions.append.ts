import fs from "fs";
import path from "path";

const decisionsFile = path.join(__dirname, "decisions.log.jsonl");

function ensure() {
  const dir = path.dirname(decisionsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(decisionsFile)) fs.writeFileSync(decisionsFile, "", "utf8");
}

/** Append-only autonomy decisions (with optional versioning via caller). */
export function appendDecision(row: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(decisionsFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}
