import fs from "fs";
import path from "path";

const file = path.join(__dirname, "pattern.memory.jsonl");

const failurePatterns: any[] = [];

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function storePattern(pattern: any) {
  failurePatterns.push(pattern);
  ensure();
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), ...pattern }) + "\n", "utf8");
}

export function getPatterns(limit = 100): any[] {
  ensure();
  return failurePatterns.slice(-Math.max(1, limit));
}
