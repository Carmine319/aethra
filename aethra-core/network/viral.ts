export type ViralPayload = {
  insight: string;
  proof: string;
  call_to_action: string;
};

export function buildViralOutput(input?: Partial<ViralPayload>): ViralPayload {
  return {
    insight: String(input?.insight || "I built this in 24h - here is the system insight."),
    proof: String(input?.proof || "Verified outcome recorded by TrustOrigin."),
    call_to_action: String(input?.call_to_action || "Build yours now with AETHRA."),
  };
}
