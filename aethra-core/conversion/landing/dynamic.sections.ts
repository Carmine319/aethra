export function buildDynamicSections(
  currentSections: string[],
  dropoff: { pointsOfAbandonment: string[] }
): string[] {
  const base = Array.isArray(currentSections) ? currentSections : [];
  const boosts = Array.isArray(dropoff?.pointsOfAbandonment) ? dropoff.pointsOfAbandonment : [];
  const mapped = boosts.map((p) => `resolve-${String(p).replace(/\s+/g, "-").toLowerCase()}`);
  return [...new Set([...mapped, ...base])];
}
