/**
 * Ω v15 — Explicit lifecycle states for observable protocol evolution.
 */

export type Lifecycle = "draft" | "candidate" | "active" | "sunset";

export function transitionLifecycle(
  current: Lifecycle,
  event: "promote" | "activate" | "deprecate"
): Lifecycle {
  const graph: Record<Lifecycle, Partial<Record<typeof event, Lifecycle>>> = {
    draft: { promote: "candidate" },
    candidate: { activate: "active" },
    active: { deprecate: "sunset" },
    sunset: {},
  };
  return graph[current]?.[event] ?? current;
}
