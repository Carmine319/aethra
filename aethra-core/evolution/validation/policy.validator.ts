import { assertEvolutionAllowed } from "../governance/evolution.policy";

export function validateAgainstPolicy() {
  assertEvolutionAllowed();
  return true;
}
