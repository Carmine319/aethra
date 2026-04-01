import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const PATTERN_FILE = path.join(MEMORY_DIR, "pattern_library.json");
const DISTRIBUTED_FILE = path.join(MEMORY_DIR, "distributed_learning.json");

function readPatternLibrary(): any {
  try {
    return JSON.parse(fs.readFileSync(PATTERN_FILE, "utf8"));
  } catch {
    return {};
  }
}

export function shareLearnings() {
  const patterns = readPatternLibrary();
  const best = Array.isArray(patterns.highest_converting_offers) ? patterns.highest_converting_offers.slice(0, 3) : [];
  const weak = Array.isArray(patterns.highest_converting_offers) ? patterns.highest_converting_offers.slice(-3) : [];

  const distribution = {
    generated_at: Date.now(),
    strategy_packets_propagated: best,
    suppressed_weak_strategies: weak,
    evolution_rule: "Best performers propagate globally; weak performers are suppressed.",
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(DISTRIBUTED_FILE, JSON.stringify(distribution, null, 2) + "\n", "utf8");
  return distribution;
}
