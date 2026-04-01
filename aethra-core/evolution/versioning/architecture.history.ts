import fs from "fs";
import path from "path";

const architectureHistory: any[] = [];
const file = path.join(__dirname, "architecture.history.jsonl");

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function logArchitecture(state: Record<string, unknown>) {
  ensure();
  const row = { state, timestamp: Date.now() };
  architectureHistory.push(row);
  fs.appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
  return row;
}

export function getArchitectureHistory(limit = 200) {
  return architectureHistory.slice(-Math.max(1, limit));
}
