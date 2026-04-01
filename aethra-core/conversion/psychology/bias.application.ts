import { PERSUASION_TRIGGERS } from "./trigger.library";

export function applyBiases(layer: Record<string, unknown>) {
  return {
    ...layer,
    biases: {
      defaultEffect: PERSUASION_TRIGGERS.clarity,
      lossAversion: PERSUASION_TRIGGERS.lossAversion,
      socialProof: PERSUASION_TRIGGERS.socialProof,
    },
  };
}
