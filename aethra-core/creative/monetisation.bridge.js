"use strict";

function attachMonetisation(landing, product) {
  const l = landing && typeof landing === "object" ? landing : {};
  const p = product && typeof product === "object" ? product : {};
  const checkoutLink = String(
    p.stripeCheckoutUrl ||
      `https://checkout.stripe.com/pay/${encodeURIComponent(String(p.name || "aethra-offer").toLowerCase().replace(/\s+/g, "-"))}`
  );
  const cta = `Buy now - ${String(p.name || "Offer")} ($${Number(p.price || 0)}): ${checkoutLink}`;
  return {
    ...l,
    checkoutLink,
    hero: {
      ...(l.hero || {}),
      cta,
    },
    contentCTA: cta,
    videoCTA: cta,
  };
}

module.exports = { attachMonetisation };
