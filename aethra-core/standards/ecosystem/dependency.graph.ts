/**
 * Ω v15 — Ecosystem dependency graph projection.
 */

export function buildGraph(nodes: any[]) {
  return nodes.map((n) => ({
    node: n.name,
    links: n.dependencies || [],
  }));
}
