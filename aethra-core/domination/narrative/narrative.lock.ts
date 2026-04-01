import { NarrativeFrame } from "./narrative.engine";

export function lockNarrative(frame: NarrativeFrame, entrenchmentScore: number) {
  return {
    locked: entrenchmentScore >= 0.4,
    framingDefault: frame.coreMessage,
    repeatability: "high",
    observability: frame.proofPoints,
  };
}
