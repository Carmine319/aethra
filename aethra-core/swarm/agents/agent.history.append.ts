import fs from "fs";
import path from "path";

const history = path.join(__dirname, "..", "memory", "agent.history.jsonl");

function ensure() {
  const dir = path.dirname(history);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(history)) fs.writeFileSync(history, "", "utf8");
}

export function logAgentAction(row: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(history, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}
