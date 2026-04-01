/**
 * Ω v15 — Reversible, additive evolution steps (no breaking invariant mutation).
 */

export type EvolutionStep = { kind: "add_field" | "deprecate_field"; target: string };

export function planEvolution(currentVersion: string, steps: EvolutionStep[]) {
  return {
    from: currentVersion,
    to: `${currentVersion}+${steps.length}`,
    steps,
    reversible: steps.every((s) => s.kind !== "deprecate_field" || s.target.length > 0),
  };
}
