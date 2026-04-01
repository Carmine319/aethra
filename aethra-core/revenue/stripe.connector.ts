export type CheckoutProduct = {
  product_name: string;
  price: number;
  email?: string;
  product_type?: string;
  venture_id?: string;
};

export async function createCheckout(product: CheckoutProduct) {
  return {
    ok: true,
    detail: "Runtime implementation is in stripe.connector.js",
    product,
  };
}

export function handleWebhook(event: unknown) {
  return {
    received: true,
    detail: "Runtime implementation is in stripe.connector.js",
    event,
  };
}
