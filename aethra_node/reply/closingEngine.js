"use strict";

function generateOffer(context = {}) {
  const niche = String(context.niche || "your wedge").slice(0, 80);
  return {
    title: `Structured diagnostic — ${niche}`,
    price: String(context.price || "£99"),
    outcome: "Clear pass or fail on viability plus a written execution path",
    delivery: "24–48 hours from kickoff",
  };
}

function closingMessage(offer) {
  const o = offer && typeof offer === "object" ? offer : generateOffer({});
  return `Based on the thread so far, the next step would be:

${o.title}
→ ${o.outcome}
→ ${o.price}

If that aligns, a payment link can follow on confirmation.`;
}

module.exports = { generateOffer, closingMessage };
