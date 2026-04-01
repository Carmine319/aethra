export function amplifyConversion(metrics: { conversionRate: number; friction: number; trust: number }) {
  const improvedRate = Number((Math.max(0, metrics.conversionRate) * (1 + Math.max(0, metrics.trust) * 0.25) * (1 - Math.max(0, metrics.friction) * 0.2)).toFixed(4));
  return {
    improvedRate,
    lift: Number((improvedRate - Number(metrics.conversionRate || 0)).toFixed(4)),
  };
}
