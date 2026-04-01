import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const NETWORK_FILE = path.join(MEMORY_DIR, "network-data.json");
const MOAT_FILE = path.join(MEMORY_DIR, "data_moat.json");

export function buildDataMoat() {
  let count = 0;
  try {
    const raw = JSON.parse(fs.readFileSync(NETWORK_FILE, "utf8"));
    count = Array.isArray(raw) ? raw.length : 0;
  } catch {
    count = 0;
  }

  const moat = {
    generated_at: Date.now(),
    proprietary_data_points: count,
    structure: [
      "Action-level venture telemetry",
      "Context-tagged conversion and revenue outcomes",
      "Linked trust verification records",
    ],
    integration: "Decision engine prioritizes strategies using this proprietary dataset.",
    competitive_rule: "Competitors cannot access this private structured performance graph.",
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(MOAT_FILE, JSON.stringify(moat, null, 2) + "\n", "utf8");
  return moat;
}
