export function detectRegime(features: any[]) {
  const list = features || [];
  const avg =
    list.length === 0 ? 0 : list.reduce((s, f) => s + Number(f.momentum ?? 0), 0) / list.length;
  if (avg > 0.7) return "bull";
  if (avg < -0.7) return "bear";
  return "neutral";
}
