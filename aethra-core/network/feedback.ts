import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const NETWORK_FILE = path.join(MEMORY_DIR, "network-data.json");
const FEEDBACK_FILE = path.join(MEMORY_DIR, "feedback_updates.json");

function readRows(): any[] {
  try {
    const raw = fs.readFileSync(NETWORK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function processUserFeedback() {
  const rows = readRows();
  const successes = rows.filter((r) => Number(r.revenue_outcome || 0) > 0);
  const failures = rows.filter((r) => String(r.failure || "").trim().length > 0);

  const updates = {
    generated_at: Date.now(),
    success_reports: successes.length,
    failures: failures.length,
    usage_patterns: {
      most_common_business_type: rows[rows.length - 1]?.business_type || "unknown",
      average_conversion_rate:
        rows.length === 0 ? 0 : rows.reduce((a, r) => a + Number(r.conversion_rate || 0), 0) / rows.length,
    },
    system_updates: [
      "Promote proven offers in recommendation stack",
      "Down-rank failing configurations automatically",
    ],
    improved_prompts: [
      "Prioritize high-converting offer structures first",
      "Request context early to improve venture fit",
    ],
    refined_strategies: [
      "Allocate effort toward niches with repeat wins",
      "Suppress low-signal channels after repeated failures",
    ],
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(updates, null, 2) + "\n", "utf8");
  return updates;
}
