import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const NETWORK_FILE = path.join(MEMORY_DIR, "network-data.json");
const PATTERN_FILE = path.join(MEMORY_DIR, "pattern_library.json");
const ADVANTAGE_FILE = path.join(MEMORY_DIR, "advantage_plan.json");

function readJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function convertDataToAdvantage() {
  const allData = readJson(NETWORK_FILE);
  const patterns = readJson(PATTERN_FILE);
  const rows = Array.isArray(allData) ? allData : [];
  const topOffer = patterns?.highest_converting_offers?.[0] || null;
  const topNiche = patterns?.best_performing_niches?.[0] || null;
  const topPath = patterns?.fastest_revenue_paths?.[0] || null;

  const plan = {
    generated_at: Date.now(),
    total_data_points: rows.length,
    top_performing_strategies: {
      offer: topOffer,
      niche: topNiche,
      path: topPath,
    },
    priority_actions: [
      "Aggregate all user activity into structured memory",
      "Prioritize highest-yield offers and niches",
      "Deploy best strategy packets before market drift",
      "Continuously refresh ranking as new outcomes arrive",
    ],
    flywheel: "Better data -> better decisions -> more revenue -> more users -> more data",
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(ADVANTAGE_FILE, JSON.stringify(plan, null, 2) + "\n", "utf8");
  return plan;
}
