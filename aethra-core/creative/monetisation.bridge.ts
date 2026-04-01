export type ProductInput = {
  name: string;
  price: number;
  stripeCheckoutUrl?: string;
};

export type MonetisedLanding = Record<string, unknown> & {
  hero?: { cta?: string; [k: string]: unknown };
  checkoutLink?: string;
};

export function attachMonetisation(landing: MonetisedLanding, product: ProductInput) {
  const checkoutLink = String(
    product.stripeCheckoutUrl ||
    `https://checkout.stripe.com/pay/${encodeURIComponent(String(product.name || "aethra-offer").toLowerCase().replace(/\s+/g, "-"))}`
  );
  const cta = `Buy now - ${product.name} ($${Number(product.price || 0)}): ${checkoutLink}`;

  return {
    ...landing,
    checkoutLink,
    hero: {
      ...(landing.hero || {}),
      cta,
    },
    contentCTA: cta,
    videoCTA: cta,
  };
}
