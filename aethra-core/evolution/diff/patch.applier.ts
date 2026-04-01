import fs from "fs";
import path from "path";

/**
 * NO direct mutation of live Ω modules — records intended patch only (structurally persistent audit).
 */
export function recordPatchIntent(diff: Record<string, unknown>, proposalId: string) {
  const file = path.join(__dirname, "..", "versioning", "patch.intents.jsonl");
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(
    file,
    JSON.stringify({ ts: Date.now(), proposal_id: proposalId, diff }) + "\n",
    "utf8"
  );
  return { recorded: true, proposal_id: proposalId };
}
