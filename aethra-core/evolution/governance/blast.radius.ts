import { readEvolutionPolicy } from "./evolution.policy";

export function assessBlastRadius(change: { affected_modules?: number; total_modules?: number }) {
  const affected = Number(change.affected_modules || 0);
  const total = Math.max(1, Number(change.total_modules || 1));
  const radius = affected / total;
  const p = readEvolutionPolicy();
  const max = Number(p.max_blast_radius ?? 0.35);
  if (radius > max) {
    throw new Error(`Blast radius ${radius} exceeds policy max ${max}`);
  }
  return { radius, ok: true };
}
