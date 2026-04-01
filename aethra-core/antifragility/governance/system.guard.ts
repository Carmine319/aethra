import { assertAntifragilityOperational } from "./stress.policy";
import { readAntifragilityPolicy } from "./stress.policy";

export function guardSubsystemHandoff(input: {
  source: string;
  target: string;
  failureLoad: number;
}) {
  assertAntifragilityOperational();
  const p = readAntifragilityPolicy();
  if (Number(input.failureLoad || 0) > Number(p.cascade_isolation_threshold ?? 0.3)) {
    throw new Error(`Cascade guard: blocked handoff ${input.source}→${input.target}`);
  }
  return { ok: true, mode: "handoff_allowed" };
}
