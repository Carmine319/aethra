import fs from "fs";
import path from "path";

const reputation: Record<string, number> = {};
const file = path.join(__dirname, "..", "memory", "reputation.jsonl");

function ensure() {
  if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function updateReputation(entity: string, score: number) {
  reputation[entity] = (reputation[entity] || 0) + Number(score || 0);
  ensure();
  fs.appendFileSync(
    file,
    JSON.stringify({ ts: Date.now(), entity, delta: score, total: reputation[entity] }) + "\n",
    "utf8"
  );
  return reputation[entity];
}

export function getReputation(entity: string) {
  return Number(reputation[entity] || 0);
}
