export function neutraliseCompetitors(competitors: Array<Record<string, unknown>>, shiftedCriteria: string[]) {
  const mapped = competitors.map((item) => {
    const score = Number(item.score || 0.4);
    const relevance = Number((Math.max(0, score - shiftedCriteria.length * 0.08)).toFixed(4));
    return { name: String(item.name || "unknown"), relevance };
  });
  return {
    neutralised: mapped.filter((item) => item.relevance < 0.35),
    remaining: mapped,
  };
}
