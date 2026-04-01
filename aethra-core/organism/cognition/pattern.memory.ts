const patternMemory: Array<{ pattern: string; score: number; ts: number }> = [];

export function storePattern(pattern: string, score: number) {
  const row = { pattern: String(pattern || "unknown"), score: Number(score || 0), ts: Date.now() };
  patternMemory.push(row);
  return row;
}

export function getBestPatterns(limit = 5) {
  return [...patternMemory]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, Math.max(1, Number(limit || 5)));
}
