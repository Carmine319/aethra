import { readEvolutionPolicy } from "../governance/evolution.policy";

export function canaryExposure(phase: number) {
  const p = readEvolutionPolicy();
  const start = Number(p.canary_exposure_start ?? 0.1);
  const steps = [start, 0.5, 1.0];
  return steps[Math.min(2, Math.max(0, phase - 1))] ?? start;
}
