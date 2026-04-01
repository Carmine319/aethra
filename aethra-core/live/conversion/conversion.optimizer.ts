export function optimiseConversion(input: { conversionRate: number; cta: string; price: number; message: string }) {
  if (input.conversionRate >= 0.08) return { ...input, mutated: false };
  return {
    conversionRate: Number((input.conversionRate * 1.2 + 0.01).toFixed(4)),
    cta: "Get results now",
    price: Number((input.price * 0.95).toFixed(2)),
    message: `${input.message} with clearer proof`,
    mutated: true,
  };
}
