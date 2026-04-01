"use strict";

function generateContent(offer) {
  const input = offer && typeof offer === "object" ? offer : {};
  const name = String(input.name || input.idea || "Revenue Sprint");
  const audience = String(input.targetAudience || "operators");
  const link = String(input.checkoutLink || input.url || "https://checkout.stripe.com/pay/aethra");
  const bestHook = String(input.bestHook || "");
  const bestCTA = String(input.bestCTA || "");
  return [
    {
      hook: bestHook || `Problem-based: Why ${audience} post daily but still miss pipeline targets`,
      insight: "Content without a direct monetisation path creates activity, not revenue.",
      value: `Use a single-offer narrative with one CTA destination. ${name} ships this in days.`,
      CTA: bestCTA || `Get the playbook: ${link}`,
    },
    {
      hook: "Contrarian: More content is not the answer, better conversion architecture is",
      insight: "Distribution volume compounds only when offer clarity is already solved.",
      value: "Build pain -> proof -> offer -> CTA sequencing before scaling channels.",
      CTA: `Launch now: ${link}`,
    },
    {
      hook: "Proof-based: 3 scenarios where conversion-first creative outperformed generic posting",
      insight: "Hooks tied to revenue outcomes consistently improve intent quality.",
      value: "Use quantified outcomes, time-bound urgency, and risk reversal in every asset.",
      CTA: `See offer + checkout: ${link}`,
    },
    {
      hook: `Direct offer: ${name} for teams who need faster sales without bigger ad spend`,
      insight: "If you already have attention, conversion optimization is the fastest lever.",
      value: "Done-for-you brand, landing, and distribution with monetisation built in.",
      CTA: `Buy access: ${link}`,
    },
  ];
}

module.exports = { generateContent };
