import { buildDependencyGraph } from "./dependency.graph";

export function analyseImpact(system: Record<string, unknown>, proposal: { dependency_hints?: string[] }) {
  const graph = buildDependencyGraph(system);
  const touched = new Set(proposal.dependency_hints || []);
  const affected = graph.filter((n) => touched.has(n.node)).length;
  return {
    graph,
    affected_nodes: affected,
    total_nodes: graph.length,
  };
}
