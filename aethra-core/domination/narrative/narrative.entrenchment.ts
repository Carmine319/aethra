import { NarrativeFrame } from "./narrative.engine";

export function entrenchNarrative(frame: NarrativeFrame, repetitions: number) {
  const repeatCount = Math.max(1, repetitions);
  return {
    repeatedMessage: Array.from({ length: repeatCount }).map(() => frame.coreMessage),
    entrenchmentScore: Number(Math.min(1, repeatCount / 10).toFixed(4)),
    observable: frame.proofPoints,
  };
}
