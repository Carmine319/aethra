export function runABTest(variants: Array<Record<string, unknown>>) {
  const rows = Array.isArray(variants) ? variants : [];
  return rows.map((v, idx) => {
    const visitors = 100 + idx * 25;
    const conversionRate = 0.02 + idx * 0.006;
    const revenue = Number((visitors * conversionRate * Number(v.corePrice || 99)).toFixed(2));
    return { ...v, visitors, conversionRate: Number(conversionRate.toFixed(4)), revenue };
  });
}
