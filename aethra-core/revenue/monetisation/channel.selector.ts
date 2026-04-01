export function selectChannel(signalScore: number): "x" | "linkedin" | "youtube" {
  const s = Number(signalScore) || 0;
  if (s > 50) return "x";
  if (s > 30) return "linkedin";
  return "youtube";
}
