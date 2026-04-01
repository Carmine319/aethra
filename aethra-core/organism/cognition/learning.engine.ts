export function learnFromOutcomes(outcomes: Array<Record<string, unknown>>) {
  const wins = outcomes.filter((item) => Number(item.revenue || 0) > Number(item.cost || 0));
  const fails = outcomes.length - wins.length;
  return {
    winRate: Number((wins.length / Math.max(1, outcomes.length)).toFixed(4)),
    failRate: Number((fails / Math.max(1, outcomes.length)).toFixed(4)),
    whatConverts: wins.slice(0, 3).map((item) => String(item.pattern || item.channel || "unknown")),
  };
}
