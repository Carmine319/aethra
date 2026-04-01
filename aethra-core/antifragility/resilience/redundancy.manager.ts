import { readAntifragilityPolicy } from "../governance/stress.policy";

export function ensureRedundantPaths(paths: string[]) {
  const p = readAntifragilityPolicy();
  const min = Number(p.redundancy_min_paths ?? 2);
  if ((paths || []).length < min) {
    throw new Error(`Redundancy invariant: need at least ${min} execution paths`);
  }
  return { paths, active: paths.slice(0, min) };
}
