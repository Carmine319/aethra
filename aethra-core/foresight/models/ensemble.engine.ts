export function ensembleForecast(models: Array<{ estimate: number; weight: number }>) {
  const m = models || [];
  const wsum = m.reduce((s, x) => s + Math.max(0, Number(x.weight || 0)), 0) || 1;
  const blended = m.reduce((s, x) => s + Number(x.estimate || 0) * (Number(x.weight || 0) / wsum), 0);
  return { ensemble_estimate: Math.round(blended * 1000) / 1000, model_count: m.length };
}
