export function deployLanding(offer: { outcome: string; audience: string; price: number; cta: string }) {
  return {
    url: `https://aethra.local/offer/${Date.now()}`,
    headline: `${offer.outcome} for ${offer.audience}`,
    cta: offer.cta,
    deployed: true,
  };
}
