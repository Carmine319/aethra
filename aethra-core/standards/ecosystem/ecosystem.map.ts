import { buildGraph } from "./dependency.graph";

/**
 * Ω v15 — Aggregate ecosystem view from node list.
 */

export function buildEcosystemMap(nodes: { name: string; dependencies?: string[] }[]) {
  return {
    nodes: nodes.map((n) => n.name),
    edges: buildGraph(nodes),
  };
}
