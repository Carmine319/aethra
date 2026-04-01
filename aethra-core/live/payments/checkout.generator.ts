export function generateCheckout(offer: { price: number }) {
  return {
    checkoutUrl: `https://checkout.aethra.local/${Date.now()}`,
    amount: Number(offer.price || 0),
  };
}
