import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "federation.log.jsonl");

const partners = new Map<string, { id: string; registered_at: number; capabilities: string[] }>();

function ensure() {
  const dir = path.dirname(logFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "", "utf8");
}

export function federationLog(row: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(logFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

export function registerPartner(p: { id: string; capabilities: string[] }) {
  partners.set(p.id, { id: p.id, registered_at: Date.now(), capabilities: p.capabilities || [] });
  federationLog({ event: "partner_registered", partner_id: p.id, capabilities: p.capabilities });
  return partners.get(p.id);
}

export function listPartners() {
  return [...partners.values()];
}
