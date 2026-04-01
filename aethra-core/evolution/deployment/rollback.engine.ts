import fs from "fs";
import path from "path";

export function recordRollbackIntent(proposalId: string, reason: string) {
  const file = path.join(__dirname, "..", "versioning", "rollbacks.jsonl");
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), proposal_id: proposalId, reason }) + "\n", "utf8");
  return { rolled_back: true, proposal_id: proposalId };
}
