import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const PATTERN_FILE = path.join(MEMORY_DIR, "pattern_library.json");
const DOMINANCE_FILE = path.join(MEMORY_DIR, "market_dominance_plan.json");

export function increaseMarketControl() {
  let patterns: any = {};
  try {
    patterns = JSON.parse(fs.readFileSync(PATTERN_FILE, "utf8"));
  } catch {
    patterns = {};
  }

  const topNiches = Array.isArray(patterns.best_performing_niches) ? patterns.best_performing_niches.slice(0, 5) : [];

  const plan = {
    generated_at: Date.now(),
    high_value_niches: topNiches,
    deployment_logic: [
      "Identify top-value niches from live data",
      "Deploy multiple ventures in parallel per niche",
      "Saturate channels with variant offers",
      "Capture demand before competitors adapt",
    ],
    dominance_equation: "Speed + data + replication = dominance",
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(DOMINANCE_FILE, JSON.stringify(plan, null, 2) + "\n", "utf8");
  return plan;
}
