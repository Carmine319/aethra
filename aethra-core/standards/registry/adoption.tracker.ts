/**
 * Ω v15 — Observe adoption depth / breadth for economic justification signals.
 */

const usage = new Map<string, number>();

export function recordAdoption(protocolName: string, delta = 1) {
  usage.set(protocolName, (usage.get(protocolName) ?? 0) + delta);
  return usage.get(protocolName)!;
}

export function adoptionSummary() {
  return Object.fromEntries(usage);
}
