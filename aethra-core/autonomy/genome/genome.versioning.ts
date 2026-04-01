import fs from "fs";
import path from "path";
import type { Genome } from "./genome.registry";

const file = path.join(__dirname, "genome.versions.jsonl");

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

let versionCounter = 0;

export function saveVersion(genome: Genome) {
  ensure();
  versionCounter += 1;
  const row = { ...genome, version: versionCounter, timestamp: Date.now() };
  fs.appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
  return row;
}
