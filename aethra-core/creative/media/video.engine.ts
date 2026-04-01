export type VideoOffer = Record<string, unknown>;

export type VideoCreative = {
  hook: string;
  script: string;
  scenes: string[];
  format: Array<"short" | "long">;
  CTA: string;
};

export function generateVideo(offer: VideoOffer): VideoCreative {
  const name = String(offer.name || offer.idea || "Revenue Sprint");
  const audience = String(offer.targetAudience || "founders");
  const ctaUrl = String(offer.checkoutLink || offer.url || "https://checkout.stripe.com/pay/aethra");

  const hook = `Stop losing sales in silence: ${name} turns weak traffic into paying customers in 7 days.`;
  const script = [
    `${hook}`,
    `Most ${audience} keep publishing but never convert because the offer story is unclear.`,
    `${name} fixes this with a direct mechanism: sharpen pain, prove outcomes, and drive one clear action.`,
    `Tap the checkout now and launch your conversion sprint: ${ctaUrl}`,
  ].join(" ");

  return {
    hook,
    script,
    scenes: [
      "Scene 1 (0-3s): high-contrast pain statement + revenue loss number overlay.",
      "Scene 2: explain root cause and mechanism in plain language.",
      "Scene 3: show proof scenarios and expected outcomes.",
      `Scene 4: direct CTA screen with checkout link ${ctaUrl}.`,
    ],
    format: ["short", "long"],
    CTA: `Start now: ${ctaUrl}`,
  };
}
