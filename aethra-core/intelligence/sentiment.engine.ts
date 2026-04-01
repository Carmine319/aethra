export type SentimentOutput = {
  complaints: string[];
  frictionPoints: string[];
  improvedOffer: string;
};

export function analyseFeedback(data: unknown[]): SentimentOutput {
  const rows = Array.isArray(data) ? data.map((x) => String(x || "").toLowerCase()) : [];
  const complaints = rows.filter((r) => /slow|expensive|confusing|no reply|poor/.test(r)).slice(0, 10);
  const frictionPoints = [];
  if (rows.some((r) => r.includes("slow"))) frictionPoints.push("onboarding_speed");
  if (rows.some((r) => r.includes("expensive"))) frictionPoints.push("price_clarity");
  if (rows.some((r) => r.includes("confusing"))) frictionPoints.push("offer_positioning");
  if (rows.some((r) => r.includes("no reply"))) frictionPoints.push("response_time");
  if (rows.some((r) => r.includes("poor"))) frictionPoints.push("delivery_quality");
  const improvedOffer = frictionPoints.length
    ? `Improve ${frictionPoints.join(", ")} and add transparent ROI reporting`
    : "Maintain offer and reinforce proof-led messaging";
  return { complaints, frictionPoints, improvedOffer };
}

export function refineOffer(opportunity: Record<string, unknown> | string) {
  const source =
    opportunity && typeof opportunity === "object"
      ? opportunity
      : { name: String(opportunity || "offer") };
  const payload = [source.description, source.positioning, source.offer, source.name];
  const analysis = analyseFeedback(payload);
  return {
    ...source,
    description: String(source.description || source.name || "Offer")
      .replace(/complex|confusing/gi, "clear")
      .replace(/slow/gi, "fast"),
    conversionLiftHint: analysis.frictionPoints.length ? 0.12 : 0.04,
    clarityUpgrade: true,
    frictionRemoved: analysis.frictionPoints,
    improvedOffer: analysis.improvedOffer,
  };
}
