import fs from "fs";
import path from "path";
import type { EvolutionProposal } from "./proposal.schema";

const file = path.join(__dirname, "..", "versioning", "proposal.queue.jsonl");

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function enqueueProposal(p: EvolutionProposal) {
  ensure();
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), proposal: p }) + "\n", "utf8");
  return p;
}

export function readProposalQueue(limit = 500): EvolutionProposal[] {
  ensure();
  const lines = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((x) => x.trim())
    .slice(-Math.max(1, limit));
  return lines.map((l) => JSON.parse(l).proposal);
}
