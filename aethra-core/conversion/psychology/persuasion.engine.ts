import { PERSUASION_TRIGGERS } from "./trigger.library";
import { applyBiases } from "./bias.application";
import { reduceCognitiveLoad } from "./cognitive.load.reducer";

export function applyPsychology(layer: Record<string, unknown>) {
  const enriched = {
    ...layer,
    persuasion: {
      scarcity: PERSUASION_TRIGGERS.scarcity,
      urgency: PERSUASION_TRIGGERS.urgency,
      authority: PERSUASION_TRIGGERS.authority,
      socialProof: PERSUASION_TRIGGERS.socialProof,
      lossAversion: PERSUASION_TRIGGERS.lossAversion,
      clarity: PERSUASION_TRIGGERS.clarity,
    },
  };
  return reduceCognitiveLoad(applyBiases(enriched));
}
