"use strict";

function generateVideo(offer) {
  const input = offer && typeof offer === "object" ? offer : {};
  const name = String(input.name || input.idea || "Revenue Sprint");
  const audience = String(input.targetAudience || "founders");
  const ctaUrl = String(input.checkoutLink || input.url || "https://checkout.stripe.com/pay/aethra");
  const hook = `Stop losing sales in silence: ${name} turns weak traffic into paying customers in 7 days.`;
  const script = [
    hook,
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

module.exports = { generateVideo };
