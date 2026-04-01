export type LineageNode = { id: string; parent?: string };

export function appendLineage(nodes: LineageNode[], child: LineageNode) {
  return [...nodes, child];
}

export function traceLineage(nodes: LineageNode[], id: string): string[] {
  const chain: string[] = [];
  let cur: string | undefined = id;
  const map = new Map(nodes.map((n) => [n.id, n.parent]));
  while (cur) {
    chain.push(cur);
    cur = map.get(cur);
  }
  return chain;
}
