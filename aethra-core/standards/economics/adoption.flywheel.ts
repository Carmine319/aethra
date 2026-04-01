import { computeIncentiveSignal } from "./incentive.engine";
import { computeSwitchingCost } from "./switching.cost.engine";

/**
 * Ω v15 — Flywheel: incentives rise with depth; switching cost tracks structurally.
 */

export function simulateFlywheelPulse(adoption: number, depth: number) {
  return {
    incentive: computeIncentiveSignal(adoption, depth),
    switchingCost: computeSwitchingCost(adoption, depth),
  };
}
