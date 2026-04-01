"use strict";

function computeExecutionFeedback(data) {
  const rows = Array.isArray(data) ? data : [];
  const byChannel = new Map();
  const byMessage = new Map();
  for (const r of rows) {
    const channel = String((r && r.channel) || "outreach");
    const msg = String((r && r.messageType) || "direct");
    const converted = Number((r && r.converted) || 0) > 0 ? 1 : 0;
    const c = byChannel.get(channel) || { sent: 0, won: 0 };
    c.sent += 1;
    c.won += converted;
    byChannel.set(channel, c);
    const m = byMessage.get(msg) || { sent: 0, won: 0 };
    m.sent += 1;
    m.won += converted;
    byMessage.set(msg, m);
  }
  const topChannel = [...byChannel.entries()].sort((a, b) => b[1].won / Math.max(1, b[1].sent) - a[1].won / Math.max(1, a[1].sent))[0];
  const topMessage = [...byMessage.entries()].sort((a, b) => b[1].won / Math.max(1, b[1].sent) - a[1].won / Math.max(1, a[1].sent))[0];
  const totalSent = rows.length || 1;
  const totalWon = rows.reduce((a, r) => a + (Number((r && r.converted) || 0) > 0 ? 1 : 0), 0);
  const totalClicks = rows.reduce((a, r) => a + Number((r && r.clicks) || 0), 0);
  const totalImpressions = rows.reduce((a, r) => a + Number((r && r.impressions) || 0), 0);
  const performance = rows.map((r) => {
    const row = r && typeof r === "object" ? r : {};
    const impressions = Math.max(1, Number(row.impressions || 100));
    const clicks = Number(row.clicks || 0);
    const conversions = Number(row.converted || 0) > 0 ? 1 : 0;
    return {
      hook: String(row.hook || "generic hook"),
      platform: String(row.channel || "outreach"),
      ctr: Number((clicks / impressions).toFixed(4)),
      conversionRate: Number((conversions / Math.max(1, clicks)).toFixed(4)),
      cta: String(row.cta || "Book now"),
    };
  });
  const bestAsset = [...performance].sort((a, b) => (b.conversionRate * 0.7 + b.ctr * 0.3) - (a.conversionRate * 0.7 + a.ctr * 0.3))[0];
  return {
    bestChannel: topChannel ? topChannel[0] : "outreach",
    bestMessageType: topMessage ? topMessage[0] : "direct",
    conversionRate: Number((totalWon / totalSent).toFixed(4)),
    contentPerformance: performance,
    ctr: Number((totalClicks / Math.max(1, totalImpressions)).toFixed(4)),
    bestHook: bestAsset ? bestAsset.hook : "generic hook",
    bestPlatform: bestAsset ? bestAsset.platform : (topChannel ? topChannel[0] : "outreach"),
    bestCTA: bestAsset ? bestAsset.cta : "Book now",
  };
}

module.exports = { computeExecutionFeedback };
