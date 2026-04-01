import { phasedDeploy } from "./phased.deployment";
import { canaryExposure } from "./canary.engine";

export function planRollout(change: { id: string }) {
  const phases = phasedDeploy(change);
  return phases.map((ph) => ({ ...ph, canary: canaryExposure(ph.phase) }));
}
