import fs from "fs";
import path from "path";
import { createTrustOriginReceipt } from "../../trustorigin/integration";

const file = path.join(__dirname, "versions.jsonl");

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function registerVersion(entry: {
  proposal_id: string;
  version: string;
  snapshot_ref: string;
  lineage_parent?: string;
}) {
  ensure();
  const receipt = createTrustOriginReceipt({
    venture_id: `evolution:${entry.proposal_id}`,
    business_record: { version: entry.version, snapshot: entry.snapshot_ref },
    execution_proof: { proposal_id: entry.proposal_id, parent: entry.lineage_parent || "genesis" },
    revenue_snapshot: { structural: true },
    mutation_history: [{ action: "version_register", ts: Date.now() }],
    previous_hash: "genesis",
  });
  const row = { ...entry, receipt_id: receipt.receipt_id, verification_hash: receipt.verification_hash, ts: Date.now() };
  fs.appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
  return { ...row, trustorigin: receipt };
}
