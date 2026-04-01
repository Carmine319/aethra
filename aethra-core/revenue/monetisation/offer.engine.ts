export function generateOffer(product: { name: string; price: number; id?: string }) {
  return {
    headline: `Get ${product.name} now`,
    price: product.price,
    product_id: product.id || product.name,
  };
}
