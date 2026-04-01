import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const NETWORK_DATA_FILE = path.join(MEMORY_DIR, "network-data.json");

export type UserAction = {
  user_id?: string;
  venture_id?: string;
  action_type?: string;
  idea_input?: string;
  business_type?: string;
  pricing_decision?: string | number;
  conversion_rate?: number;
  failure?: string;
  revenue_outcome?: number;
  context?: Record<string, unknown>;
  ts?: number;
};

function ensureStore(): void {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  if (!fs.existsSync(NETWORK_DATA_FILE)) fs.writeFileSync(NETWORK_DATA_FILE, "[]\n", "utf8");
}

function readStore(): UserAction[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(NETWORK_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(rows: UserAction[]): void {
  ensureStore();
  fs.writeFileSync(NETWORK_DATA_FILE, JSON.stringify(rows, null, 2) + "\n", "utf8");
}

export function ingestUserActivity(user_action: UserAction): UserAction {
  const rows = readStore();
  const structured: UserAction = {
    ts: Date.now(),
    action_type: String(user_action?.action_type || "unknown"),
    user_id: String(user_action?.user_id || "anonymous"),
    venture_id: String(user_action?.venture_id || "n/a"),
    idea_input: String(user_action?.idea_input || ""),
    business_type: String(user_action?.business_type || ""),
    pricing_decision: user_action?.pricing_decision ?? "",
    conversion_rate: Number(user_action?.conversion_rate || 0),
    failure: String(user_action?.failure || ""),
    revenue_outcome: Number(user_action?.revenue_outcome || 0),
    context: user_action?.context && typeof user_action.context === "object" ? user_action.context : {},
  };
  rows.push(structured);
  writeStore(rows);
  return structured;
}
