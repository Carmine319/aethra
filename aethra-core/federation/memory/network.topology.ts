import { federationLog } from "./partner.registry";

export type TopologyEdge = { from: string; to: string; weight: number };

export function recordTopology(edges: TopologyEdge[]) {
  federationLog({ event: "topology_update", edges });
  return { nodes: new Set((edges || []).flatMap((e) => [e.from, e.to])).size, edges: (edges || []).length };
}
