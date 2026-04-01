export type NarrativeFrame = {
  coreMessage: string;
  proofPoints: string[];
  promise: string;
};

export function generateNarrative(opportunity: Record<string, unknown>) {
  const target = String(opportunity.targetAudience || "high-intent operators");
  const promise = String(opportunity.promise || "predictable revenue growth");
  const frame: NarrativeFrame = {
    coreMessage: `AETHRA compounds ${promise} for ${target}`,
    proofPoints: ["observable conversion lift", "measurable ROI improvements", "shorter execution cycles"],
    promise,
  };
  return frame;
}
