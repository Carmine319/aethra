import fs from "fs";
import path from "path";

const MEMORY_DIR = path.join(__dirname, "..", "memory");
const SOURCE_FILE = path.join(MEMORY_DIR, "network-data.json");
const GRAPH_FILE = path.join(MEMORY_DIR, "intelligence_graph.json");

type GraphNode = { id: string; type: string; label: string; weight: number };
type GraphEdge = { source: string; target: string; kind: string; strength: number };

function readRows(): any[] {
  try {
    const raw = fs.readFileSync(SOURCE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function upsertNode(map: Map<string, GraphNode>, type: string, label: string): string {
  const safeLabel = String(label || "unknown").slice(0, 120);
  const id = `${type}:${safeLabel.toLowerCase()}`;
  const current = map.get(id) || { id, type, label: safeLabel, weight: 0 };
  current.weight += 1;
  map.set(id, current);
  return id;
}

function upsertEdge(map: Map<string, GraphEdge>, source: string, target: string, kind: string, score = 1): void {
  const id = `${source}|${target}|${kind}`;
  const current = map.get(id) || { source, target, kind, strength: 0 };
  current.strength += score;
  map.set(id, current);
}

export function buildIntelligenceGraph() {
  const rows = readRows();
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  for (const row of rows) {
    const user = upsertNode(nodeMap, "user", row.user_id || "anonymous");
    const venture = upsertNode(nodeMap, "venture", row.venture_id || "n/a");
    const niche = upsertNode(nodeMap, "niche", row.business_type || "general");
    const offer = upsertNode(nodeMap, "offer", String(row.pricing_decision || "unspecified"));
    const channel = upsertNode(nodeMap, "channel", String((row.context && row.context.channel) || "unknown"));

    upsertEdge(edgeMap, user, venture, "ownership", 1);
    upsertEdge(edgeMap, venture, niche, "targets_niche", 1);
    upsertEdge(edgeMap, venture, offer, "offer_configuration", 1);
    upsertEdge(edgeMap, venture, channel, "distribution_channel", 1);

    const successScore = Number(row.revenue_outcome || 0) > 0 ? 2 : 0;
    const failureScore = String(row.failure || "").trim() ? 2 : 0;
    if (successScore) upsertEdge(edgeMap, offer, niche, "success_relationship", successScore);
    if (failureScore) upsertEdge(edgeMap, offer, niche, "failure_correlation", failureScore);
    if (Number(row.revenue_outcome || 0) > 0) {
      upsertEdge(edgeMap, channel, offer, "revenue_pathway", Number(row.revenue_outcome || 0));
    }
  }

  const graph = {
    generated_at: Date.now(),
    node_count: nodeMap.size,
    edge_count: edgeMap.size,
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };

  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(GRAPH_FILE, JSON.stringify(graph, null, 2) + "\n", "utf8");
  return graph;
}
