/**
 * Ω v15 — Metcalfe-style network value proxy for ecosystem maps.
 */

export function estimateNetworkValue(nodeCount: number, edgeCount: number) {
  if (nodeCount <= 1) return nodeCount;
  const possible = (nodeCount * (nodeCount - 1)) / 2;
  return Math.min(1, edgeCount / possible) * nodeCount;
}
