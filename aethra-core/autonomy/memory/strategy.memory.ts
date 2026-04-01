import fs from "fs";
import path from "path";

const file = path.join(__dirname, "strategy.memory.jsonl");

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function appendStrategy(strategy: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), ...strategy }) + "\n", "utf8");
}

export function readStrategies(limit = 200): any[] {
  ensure();
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((x) => x.trim())
    .slice(-Math.max(1, Number(limit || 200)))
    .map((line) => JSON.parse(line));
}
