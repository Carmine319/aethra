import { NarrativeFrame } from "./narrative.engine";

export function embedNarrative(frame: NarrativeFrame, channels: string[]) {
  const activeChannels = channels.length ? channels : ["landing", "email", "social", "outreach"];
  return activeChannels.map((channel) => ({
    channel,
    message: frame.coreMessage,
    proof: frame.proofPoints[0],
  }));
}
