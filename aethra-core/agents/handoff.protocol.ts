/**
 * Agent handoff graph — explicit transitions only (no undefined flow).
 * Order mirrors economic pipeline: instinct → expansion paths → execution → conversion → economics/domination.
 */

export type AgentSlug =
  | "capital"
  | "outreach"
  | "creative"
  | "execution"
  | "conversion"
  | "instinct"
  | "domination";

/** Allowed next agents from a given agent (directed edges). */
export const HANDOFF_NEXT: Record<AgentSlug, AgentSlug[]> = {
  instinct: ["capital", "execution"],
  capital: ["creative", "execution", "conversion", "domination"],
  creative: ["execution", "outreach", "conversion"],
  execution: ["outreach", "conversion", "capital"],
  outreach: ["conversion", "capital"],
  conversion: ["capital", "domination"],
  domination: ["capital", "creative"],
};

export function canHandoff(from: AgentSlug, to: AgentSlug): boolean {
  const next = HANDOFF_NEXT[from];
  return Array.isArray(next) && next.includes(to);
}

export function assertHandoff(from: AgentSlug, to: AgentSlug): void {
  if (!canHandoff(from, to)) {
    throw new Error(`SCS handoff denied: ${from} → ${to} is not a defined transition`);
  }
}
