import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const SOURCE_FILE = path.join(MEMORY_DIR, "network-data.json");
const PATTERN_FILE = path.join(MEMORY_DIR, "pattern_library.json");

function readRows(): any[] {
  try {
    const raw = fs.readFileSync(SOURCE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function extractDominantPatterns() {
  const rows = readRows();
  const byOffer = new Map<string, { offer: string; conversions: number; revenue: number; runs: number }>();
  const byNiche = new Map<string, { niche: string; revenue: number; conversions: number; runs: number }>();
  const byPath = new Map<string, { path: string; wins: number; speed_hint: number }>();

  for (const row of rows) {
    const offer = String(row.pricing_decision || "unspecified");
    const niche = String(row.business_type || "general");
    const channel = String((row.context && row.context.channel) || "unknown");
    const pathKey = `${niche} -> ${channel} -> ${offer}`;
    const revenue = Number(row.revenue_outcome || 0);
    const conversion = Number(row.conversion_rate || 0);

    const o = byOffer.get(offer) || { offer, conversions: 0, revenue: 0, runs: 0 };
    o.conversions += conversion;
    o.revenue += revenue;
    o.runs += 1;
    byOffer.set(offer, o);

    const n = byNiche.get(niche) || { niche, revenue: 0, conversions: 0, runs: 0 };
    n.revenue += revenue;
    n.conversions += conversion;
    n.runs += 1;
    byNiche.set(niche, n);

    const p = byPath.get(pathKey) || { path: pathKey, wins: 0, speed_hint: 0 };
    if (revenue > 0) p.wins += 1;
    p.speed_hint += conversion;
    byPath.set(pathKey, p);
  }

  const patternLibrary = {
    generated_at: Date.now(),
    highest_converting_offers: [...byOffer.values()]
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10),
    fastest_revenue_paths: [...byPath.values()].sort((a, b) => b.wins + b.speed_hint - (a.wins + a.speed_hint)).slice(0, 10),
    best_performing_niches: [...byNiche.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    refinement_note: "Winning patterns are reused system-wide and refined continuously.",
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(PATTERN_FILE, JSON.stringify(patternLibrary, null, 2) + "\n", "utf8");
  return patternLibrary;
}
