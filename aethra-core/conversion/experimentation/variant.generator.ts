export function generateVariants(input: { headline: string; corePrice: number; cta: string }) {
  const base = input || { headline: "Increase conversions", corePrice: 99, cta: "Start now" };
  return [
    { id: "v1", headline: base.headline, corePrice: base.corePrice, cta: base.cta },
    { id: "v2", headline: `${base.headline} in 7 days`, corePrice: Number((base.corePrice * 1.05).toFixed(2)), cta: `${base.cta} - limited` },
    { id: "v3", headline: `Stop leaks. ${base.headline}`, corePrice: base.corePrice, cta: `${base.cta} now` },
  ];
}
