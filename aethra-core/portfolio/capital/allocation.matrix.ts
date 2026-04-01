export function allocatePortfolioCapital(capital: number) {
  const c = Math.max(0, Number(capital || 0));
  return {
    provenPerformers: Number((c * 0.6).toFixed(2)),
    scalingOpportunities: Number((c * 0.25).toFixed(2)),
    experimental: Number((c * 0.15).toFixed(2)),
  };
}
