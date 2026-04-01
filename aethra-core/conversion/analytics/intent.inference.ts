export function inferIntent(events: Array<Record<string, unknown>>) {
  const rows = Array.isArray(events) ? events : [];
  const highIntentSignals = rows.filter((e) => Number(e.ctaClicks || 0) > 0 || String(e.action || "").includes("checkout")).length;
  const hesitation = rows.filter((e) => Number(e.backtracks || 0) > 0 || Number(e.dwellTimeMs || 0) > 10000).length;
  return {
    buyingIntent: Number((highIntentSignals / Math.max(1, rows.length)).toFixed(4)),
    hesitationPoints: hesitation,
    readinessToConvert: highIntentSignals > hesitation ? "high" : "medium",
  };
}
