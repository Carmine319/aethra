import { NarrativeFrame } from "./narrative.engine";

export function controlMessage(frame: NarrativeFrame) {
  return {
    primary: frame.coreMessage,
    secondary: frame.proofPoints[0] || "measurable outcomes",
    consistencyRules: ["simple", "repeatable", "verifiable"],
  };
}
