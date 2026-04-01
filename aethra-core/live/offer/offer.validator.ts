export function validateOffer(offer: { outcome: string; audience: string; price: number; cta: string }) {
  const clear = Boolean(offer.outcome && offer.audience && offer.cta) && Number(offer.price || 0) > 0;
  return {
    valid: clear,
    fiveSecondClarity: clear,
  };
}
