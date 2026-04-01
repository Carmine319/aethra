import { readEvolutionPolicy } from "./evolution.policy";

export function enforceInvariants(change: any) {
  readEvolutionPolicy();
  if (change?.breaksCoreLogic) {
    throw new Error("Invariant violation");
  }
  if (change?.irreversible === true) {
    throw new Error("NO irreversible deployment — blocked");
  }
  return { ok: true };
}
